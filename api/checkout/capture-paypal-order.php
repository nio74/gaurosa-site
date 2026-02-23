<?php
/**
 * Cattura pagamento PayPal dopo approvazione utente
 * 
 * POST /api/checkout/capture-paypal-order
 * 
 * Body JSON:
 * {
 *   paypalOrderId: 'PAYPAL_ORDER_ID',
 *   orderId: 123
 * }
 * 
 * Cattura il pagamento su PayPal, poi aggiorna l'ordine nel database.
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

$paypalOrderId = trim($body['paypalOrderId'] ?? '');
$orderId = (int)($body['orderId'] ?? 0);

// Validazione
if (empty($paypalOrderId)) {
    jsonResponse(['success' => false, 'error' => 'ID ordine PayPal mancante'], 400);
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
    if ($order['payment_id'] !== $paypalOrderId) {
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
    // OTTIENI ACCESS TOKEN PAYPAL
    // =====================================================

    $authToken = getPayPalAccessToken();
    if (!$authToken) {
        jsonResponse(['success' => false, 'error' => 'Errore di connessione a PayPal'], 502);
    }

    // =====================================================
    // CATTURA PAGAMENTO SU PAYPAL
    // =====================================================

    $ch = curl_init(PAYPAL_API_URL . "/v2/checkout/orders/{$paypalOrderId}/capture");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => '{}', // Empty body required
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $authToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $paypalResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("PayPal capture cURL error: {$curlError}");
        jsonResponse(['success' => false, 'error' => 'Errore di connessione a PayPal'], 502);
    }

    $paypalData = json_decode($paypalResponse, true);

    if ($httpCode !== 200 && $httpCode !== 201) {
        $ppError = $paypalData['message'] ?? ($paypalData['details'][0]['description'] ?? 'Errore sconosciuto');
        error_log("PayPal capture error ({$httpCode}): " . json_encode($paypalData));
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella cattura del pagamento PayPal',
            'detail' => IS_LOCAL ? $ppError : null
        ], 502);
    }

    $captureStatus = $paypalData['status'] ?? '';

    // =====================================================
    // AGGIORNA ORDINE IN BASE ALLO STATO PAYPAL
    // =====================================================

    if ($captureStatus === 'COMPLETED') {
        // Extract PayPal capture ID for reference
        $captureId = null;
        if (isset($paypalData['purchase_units'][0]['payments']['captures'][0]['id'])) {
            $captureId = $paypalData['purchase_units'][0]['payments']['captures'][0]['id'];
        }

        // Pagamento riuscito
        $updateStmt = $pdo->prepare("
            UPDATE orders 
            SET status = 'processing',
                payment_status = 'paid',
                paid_at = NOW(3),
                payment_reference = :capture_id,
                updated_at = NOW(3)
            WHERE id = :id AND payment_status != 'paid'
        ");
        $updateStmt->execute([
            'id' => $orderId,
            'capture_id' => $captureId,
        ]);

        // Rileggi ordine aggiornato
        $stmt->execute(['id' => $orderId]);
        $order = $stmt->fetch();
        $orderItems = getOrderItems($pdo, $orderId);

        // Deduct stock from products/variants
        try {
            $stockResult = deductOrderStock($pdo, $orderId);
            error_log("[CapturePayPal] Stock dedotto per ordine #{$orderId}: {$stockResult['deducted']} articoli");
        } catch (Exception $stockError) {
            error_log("[CapturePayPal] ⚠️ Errore deduzione stock (non bloccante): " . $stockError->getMessage());
        }

        // Send order confirmation email (non-blocking)
        try {
            sendOrderConfirmationEmail($pdo, $orderId);
        } catch (Exception $emailError) {
            error_log("[CapturePayPal] ⚠️ Errore invio email (non bloccante): " . $emailError->getMessage());
        }

        jsonResponse([
            'success' => true,
            'message' => 'Pagamento PayPal confermato',
            'order' => formatOrderResponse($order, $orderItems),
        ]);

    } elseif ($captureStatus === 'PENDING' || $captureStatus === 'APPROVED') {
        // Pagamento in attesa (raro con PayPal, ma possibile)
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
        // Pagamento fallito
        $updateStmt = $pdo->prepare("
            UPDATE orders 
            SET payment_status = 'failed',
                updated_at = NOW(3)
            WHERE id = :id
        ");
        $updateStmt->execute(['id' => $orderId]);

        jsonResponse([
            'success' => false,
            'error' => 'Il pagamento PayPal non è andato a buon fine. Riprova.',
            'paymentStatus' => $captureStatus,
        ], 402);
    }

} catch (Exception $e) {
    error_log('❌ Errore API capture-paypal-order: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nella conferma del pagamento',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

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

function getPayPalAccessToken() {
    $ch = curl_init(PAYPAL_API_URL . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => PAYPAL_CLIENT_ID . ':' . PAYPAL_SECRET,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError || $httpCode !== 200) {
        error_log("PayPal OAuth error ({$httpCode}): {$curlError} - Response: {$response}");
        return null;
    }

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}
