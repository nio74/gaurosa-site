<?php
/**
 * Conferma ordine dopo pagamento Stripe riuscito
 * 
 * POST /api/checkout/confirm-order
 * 
 * Body JSON:
 * {
 *   paymentIntentId: 'pi_xxx',
 *   orderId: 123
 * }
 * 
 * Verifica con Stripe che il pagamento sia avvenuto, poi aggiorna l'ordine.
 * Returns: {success, order}
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/jwt.php';
require_once __DIR__ . '/order-email.php';
require_once __DIR__ . '/stock-helpers.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

$body = getJsonBody();

$paymentIntentId = trim($body['paymentIntentId'] ?? '');
$orderId = (int)($body['orderId'] ?? 0);

// Validazione
if (empty($paymentIntentId)) {
    jsonResponse(['success' => false, 'error' => 'ID pagamento mancante'], 400);
}
if ($orderId <= 0) {
    jsonResponse(['success' => false, 'error' => 'ID ordine non valido'], 400);
}

try {
    $pdo = getDbConnection();

    // =====================================================
    // RECUPERA ORDINE DAL DATABASE
    // =====================================================

    $stmt = $pdo->prepare("
        SELECT id, order_number, payment_id, payment_status, status, total,
               customer_email, customer_name
        FROM orders 
        WHERE id = :id 
        LIMIT 1
    ");
    $stmt->execute(['id' => $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        jsonResponse(['success' => false, 'error' => 'Ordine non trovato'], 404);
    }

    // Verifica che il payment_id corrisponda
    if ($order['payment_id'] !== $paymentIntentId) {
        jsonResponse(['success' => false, 'error' => 'Dati pagamento non corrispondenti'], 400);
    }

    // Se già pagato, ritorna successo senza modificare
    if ($order['payment_status'] === 'paid') {
        $orderItems = getOrderItems($pdo, $orderId);
        jsonResponse([
            'success' => true,
            'message' => 'Ordine già confermato',
            'order' => formatOrderResponse($order, $orderItems),
        ]);
    }

    // =====================================================
    // VERIFICA PAYMENT INTENT SU STRIPE
    // =====================================================

    $ch = curl_init("https://api.stripe.com/v1/payment_intents/{$paymentIntentId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . STRIPE_SECRET_KEY,
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $stripeResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("Stripe cURL error (confirm): {$curlError}");
        jsonResponse(['success' => false, 'error' => 'Errore di connessione al sistema di pagamento'], 502);
    }

    $stripeData = json_decode($stripeResponse, true);

    if ($httpCode !== 200 || !isset($stripeData['status'])) {
        $stripeError = $stripeData['error']['message'] ?? 'Errore sconosciuto';
        error_log("Stripe API error confirm ({$httpCode}): {$stripeError}");
        jsonResponse([
            'success' => false,
            'error' => 'Errore nella verifica del pagamento',
            'detail' => IS_LOCAL ? $stripeError : null,
        ], 502);
    }

    $piStatus = $stripeData['status'];

    // =====================================================
    // AGGIORNA ORDINE IN BASE ALLO STATO STRIPE
    // =====================================================

    if ($piStatus === 'succeeded') {
        // Pagamento riuscito
        $updateStmt = $pdo->prepare("
            UPDATE orders 
            SET status = 'processing',
                payment_status = 'paid',
                paid_at = NOW(3),
                payment_reference = :charge_id,
                updated_at = NOW(3)
            WHERE id = :id AND payment_status != 'paid'
        ");
        $chargeId = $stripeData['latest_charge'] ?? null;
        $updateStmt->execute([
            'id' => $orderId,
            'charge_id' => $chargeId,
        ]);

        // Rileggi ordine aggiornato
        $stmt->execute(['id' => $orderId]);
        $order = $stmt->fetch();
        $orderItems = getOrderItems($pdo, $orderId);

        // Deduct stock from products/variants
        try {
            $stockResult = deductOrderStock($pdo, $orderId);
            error_log("[ConfirmOrder] Stock dedotto per ordine #{$orderId}: {$stockResult['deducted']} articoli");
        } catch (Exception $stockError) {
            error_log("[ConfirmOrder] ⚠️ Errore deduzione stock (non bloccante): " . $stockError->getMessage());
        }

        // Send order confirmation email (non-blocking - don't fail the response)
        try {
            sendOrderConfirmationEmail($pdo, $orderId);
        } catch (Exception $emailError) {
            error_log("[ConfirmOrder] ⚠️ Errore invio email (non bloccante): " . $emailError->getMessage());
        }

        jsonResponse([
            'success' => true,
            'message' => 'Pagamento confermato',
            'order' => formatOrderResponse($order, $orderItems),
        ]);

    } elseif ($piStatus === 'requires_payment_method' || $piStatus === 'canceled') {
        // Pagamento fallito o annullato
        $updateStmt = $pdo->prepare("
            UPDATE orders 
            SET payment_status = 'failed',
                updated_at = NOW(3)
            WHERE id = :id
        ");
        $updateStmt->execute(['id' => $orderId]);

        jsonResponse([
            'success' => false,
            'error' => 'Il pagamento non è andato a buon fine. Riprova.',
            'paymentStatus' => $piStatus,
        ], 402);

    } elseif ($piStatus === 'processing') {
        // Pagamento in elaborazione (comune con Klarna/bonifici)
        jsonResponse([
            'success' => true,
            'message' => 'Pagamento in elaborazione. Riceverai una conferma via email.',
            'order' => [
                'id' => (int)$order['id'],
                'orderNumber' => $order['order_number'],
                'status' => $order['status'],
                'paymentStatus' => 'processing',
            ],
        ]);

    } else {
        // Stato non gestito (requires_confirmation, requires_action, etc.)
        jsonResponse([
            'success' => false,
            'error' => 'Pagamento in attesa di completamento',
            'paymentStatus' => $piStatus,
            'detail' => IS_LOCAL ? "Stripe PI status: {$piStatus}" : null,
        ], 402);
    }

} catch (Exception $e) {
    error_log('❌ Errore API confirm-order: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nella conferma dell\'ordine',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Recupera gli articoli di un ordine
 */
function getOrderItems($pdo, $orderId) {
    $stmt = $pdo->prepare("
        SELECT id, product_code, product_name, variant_sku, variant_name,
               is_virtual_variant, ordered_size, quantity, unit_price, total_price
        FROM order_items 
        WHERE order_id = :order_id
        ORDER BY id ASC
    ");
    $stmt->execute(['order_id' => $orderId]);
    return $stmt->fetchAll();
}

/**
 * Formatta la risposta dell'ordine
 */
function formatOrderResponse($order, $items) {
    return [
        'id' => (int)$order['id'],
        'orderNumber' => $order['order_number'],
        'status' => $order['status'],
        'paymentStatus' => $order['payment_status'],
        'total' => (float)$order['total'],
        'customerEmail' => $order['customer_email'],
        'customerName' => $order['customer_name'],
        'items' => array_map(function ($item) {
            return [
                'productCode' => $item['product_code'],
                'productName' => $item['product_name'],
                'variantSku' => $item['variant_sku'],
                'variantName' => $item['variant_name'],
                'orderedSize' => $item['ordered_size'],
                'quantity' => (int)$item['quantity'],
                'unitPrice' => (float)$item['unit_price'],
                'totalPrice' => (float)$item['total_price'],
            ];
        }, $items),
    ];
}
