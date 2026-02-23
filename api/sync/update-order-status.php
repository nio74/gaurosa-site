<?php
/**
 * API Sync - POST /api/sync/update-order-status.php
 * 
 * Called by MazGest when an order status changes.
 * Updates the order on gaurosa.it and triggers appropriate emails.
 * 
 * Body (JSON):
 * {
 *   "orderNumber": "GAU-20260216-001",
 *   "status": "shipped",                    // Optional
 *   "paymentStatus": "paid",                // Optional
 *   "trackingNumber": "1Z999AA10123456784", // Optional
 *   "trackingUrl": "https://...",           // Optional
 *   "paymentReference": "CRO123456789",     // Optional
 *   "internalNotes": "Spedito con UPS"      // Optional
 * }
 * 
 * Actions:
 * - Updates order fields in DB
 * - Sets shipped_at when status = 'shipped'
 * - Sets completed_at when status = 'delivered' or 'completed'
 * - Sets paid_at when paymentStatus changes to 'paid'
 * - Sends email to customer on key status changes
 * 
 * Requires x-api-key header for authentication.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../checkout/order-email.php';
require_once __DIR__ . '/../checkout/stock-helpers.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Verify API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== SYNC_API_KEY && $apiKey !== MAZGEST_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

$data = getJsonBody();
$orderNumber = $data['orderNumber'] ?? null;

if (!$orderNumber) {
    jsonResponse(['success' => false, 'error' => 'orderNumber richiesto'], 400);
}

try {
    $pdo = getDbConnection();

    // Fetch current order state
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ? LIMIT 1");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        jsonResponse(['success' => false, 'error' => "Ordine {$orderNumber} non trovato"], 404);
    }

    // Build update query dynamically
    $updates = [];
    $params = [];

    // Status update
    if (!empty($data['status']) && $data['status'] !== $order['status']) {
        $updates[] = "status = ?";
        $params[] = $data['status'];

        // Auto-set timestamps based on status
        if ($data['status'] === 'shipped' && empty($order['shipped_at'])) {
            $updates[] = "shipped_at = NOW(3)";
        }
        if (in_array($data['status'], ['delivered', 'completed']) && empty($order['completed_at'])) {
            $updates[] = "completed_at = NOW(3)";
        }
    }

    // Payment status update
    $paymentStatusChanged = false;
    if (!empty($data['paymentStatus']) && $data['paymentStatus'] !== $order['payment_status']) {
        $updates[] = "payment_status = ?";
        $params[] = $data['paymentStatus'];
        $paymentStatusChanged = true;

        // Auto-set paid_at when payment confirmed
        if ($data['paymentStatus'] === 'paid' && empty($order['paid_at'])) {
            $updates[] = "paid_at = NOW(3)";
        }
    }

    // Tracking info
    if (!empty($data['trackingNumber'])) {
        $updates[] = "tracking_number = ?";
        $params[] = $data['trackingNumber'];
    }
    if (!empty($data['trackingUrl'])) {
        $updates[] = "tracking_url = ?";
        $params[] = $data['trackingUrl'];
    }

    // Payment reference (CRO)
    if (!empty($data['paymentReference'])) {
        $updates[] = "payment_reference = ?";
        $params[] = $data['paymentReference'];
    }

    // Internal notes (append, don't overwrite)
    if (!empty($data['internalNotes'])) {
        $existingNotes = $order['internal_notes'] ?? '';
        $separator = $existingNotes ? "\n---\n" : '';
        $updates[] = "internal_notes = ?";
        $params[] = $existingNotes . $separator . $data['internalNotes'];
    }

    // Always update updated_at
    $updates[] = "updated_at = NOW(3)";

    if (empty($updates)) {
        jsonResponse(['success' => true, 'data' => ['updated' => false, 'message' => 'Nessuna modifica necessaria']]);
    }

    // Execute update
    $params[] = $order['id'];
    $sql = "UPDATE orders SET " . implode(', ', $updates) . " WHERE id = ?";
    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    error_log("[SyncBack] Ordine {$orderNumber} aggiornato: " . implode(', ', array_keys(array_filter($data))));

    // === DEDUCT STOCK when payment confirmed (bank transfers) ===
    if ($paymentStatusChanged && $data['paymentStatus'] === 'paid') {
        try {
            $stockResult = deductOrderStock($pdo, $order['id']);
            error_log("[SyncBack] Stock dedotto per ordine {$orderNumber}: {$stockResult['deducted']} articoli");
        } catch (Exception $stockError) {
            error_log("[SyncBack] ⚠️ Errore deduzione stock (non bloccante): " . $stockError->getMessage());
        }
    }

    // === SEND EMAILS ON KEY STATUS CHANGES ===
    $emailsSent = [];

    // Email: Payment confirmed (for bank transfers)
    if ($paymentStatusChanged && $data['paymentStatus'] === 'paid' && $order['payment_method'] === 'bank_transfer') {
        $emailSent = sendPaymentConfirmedEmail($pdo, $order['id']);
        if ($emailSent) {
            $emailsSent[] = 'payment_confirmed';
        }
    }

    // Email: Order shipped
    if (!empty($data['status']) && $data['status'] === 'shipped' && $order['status'] !== 'shipped') {
        $trackingNumber = $data['trackingNumber'] ?? $order['tracking_number'];
        $trackingUrl = $data['trackingUrl'] ?? $order['tracking_url'];
        $emailSent = sendShippedEmail($pdo, $order['id'], $trackingNumber, $trackingUrl);
        if ($emailSent) {
            $emailsSent[] = 'order_shipped';
        }
    }

    // Email: Order delivered
    if (!empty($data['status']) && $data['status'] === 'delivered' && $order['status'] !== 'delivered') {
        $emailSent = sendDeliveredEmail($pdo, $order['id']);
        if ($emailSent) {
            $emailsSent[] = 'order_delivered';
        }
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'updated' => true,
            'order_number' => $orderNumber,
            'emails_sent' => $emailsSent
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in update-order-status.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore del server: ' . $e->getMessage()], 500);
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

/**
 * Send "Payment Confirmed" email for bank transfers
 */
function sendPaymentConfirmedEmail($pdo, $orderId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) return false;

        $firstName = htmlspecialchars(explode(' ', $order['customer_name'])[0]);
        $orderNumber = htmlspecialchars($order['order_number']);
        $total = number_format($order['total'], 2, ',', '.');

        $subject = "Pagamento confermato - Ordine {$orderNumber} - Gaurosa Gioielli";
        $htmlBody = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #8b1538, #6b1028); padding: 30px; text-align: center;'>
                <h1 style='color: white; margin: 0; font-size: 24px;'>Pagamento Confermato</h1>
            </div>
            <div style='padding: 30px; background: #fff;'>
                <p>Gentile {$firstName},</p>
                <p>Ti confermiamo che abbiamo ricevuto il tuo bonifico bancario per l'ordine <strong>{$orderNumber}</strong>.</p>
                <div style='background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
                    <p style='margin: 0; color: #166534;'><strong>✅ Pagamento ricevuto: €{$total}</strong></p>
                </div>
                <p>Il tuo ordine è ora in lavorazione. Ti invieremo un'email quando sarà spedito.</p>
                <p>Grazie per aver scelto Gaurosa Gioielli!</p>
            </div>
            <div style='background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;'>
                <p>Gaurosa Gioielli - gaurosa.it</p>
            </div>
        </body>
        </html>";

        return sendOrderEmail($order['customer_email'], $subject, $htmlBody);
    } catch (Exception $e) {
        error_log("[SyncBack] Errore email pagamento confermato: " . $e->getMessage());
        return false;
    }
}

/**
 * Send "Order Shipped" email with tracking info
 */
function sendShippedEmail($pdo, $orderId, $trackingNumber = null, $trackingUrl = null) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) return false;

        // Fetch items for the email
        $itemStmt = $pdo->prepare("SELECT product_name, variant_name, quantity FROM order_items WHERE order_id = ?");
        $itemStmt->execute([$orderId]);
        $items = $itemStmt->fetchAll();

        $firstName = htmlspecialchars(explode(' ', $order['customer_name'])[0]);
        $orderNumber = htmlspecialchars($order['order_number']);

        $trackingHtml = '';
        if ($trackingNumber) {
            $trackingLink = $trackingUrl 
                ? "<a href='" . htmlspecialchars($trackingUrl) . "' style='color: #8b1538; font-weight: bold;'>{$trackingNumber}</a>"
                : "<strong>{$trackingNumber}</strong>";
            $trackingHtml = "
                <div style='background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
                    <p style='margin: 0 0 5px 0; color: #1e40af;'><strong>📦 Tracking spedizione:</strong></p>
                    <p style='margin: 0; color: #1e40af;'>{$trackingLink}</p>
                </div>";
        }

        $itemsHtml = '';
        foreach ($items as $item) {
            $variant = $item['variant_name'] ? " ({$item['variant_name']})" : '';
            $itemsHtml .= "<li>{$item['product_name']}{$variant} x{$item['quantity']}</li>";
        }

        $subject = "Il tuo ordine è stato spedito! - {$orderNumber} - Gaurosa Gioielli";
        $htmlBody = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #8b1538, #6b1028); padding: 30px; text-align: center;'>
                <h1 style='color: white; margin: 0; font-size: 24px;'>🚚 Ordine Spedito!</h1>
            </div>
            <div style='padding: 30px; background: #fff;'>
                <p>Gentile {$firstName},</p>
                <p>Il tuo ordine <strong>{$orderNumber}</strong> è stato spedito!</p>
                {$trackingHtml}
                <h3 style='color: #8b1538;'>Articoli spediti:</h3>
                <ul>{$itemsHtml}</ul>
                <p>Grazie per aver scelto Gaurosa Gioielli!</p>
            </div>
            <div style='background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;'>
                <p>Gaurosa Gioielli - gaurosa.it</p>
            </div>
        </body>
        </html>";

        return sendOrderEmail($order['customer_email'], $subject, $htmlBody);
    } catch (Exception $e) {
        error_log("[SyncBack] Errore email spedizione: " . $e->getMessage());
        return false;
    }
}

/**
 * Send "Order Delivered" email
 */
function sendDeliveredEmail($pdo, $orderId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) return false;

        $firstName = htmlspecialchars(explode(' ', $order['customer_name'])[0]);
        $orderNumber = htmlspecialchars($order['order_number']);

        $subject = "Ordine consegnato - {$orderNumber} - Gaurosa Gioielli";
        $htmlBody = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #8b1538, #6b1028); padding: 30px; text-align: center;'>
                <h1 style='color: white; margin: 0; font-size: 24px;'>✅ Ordine Consegnato</h1>
            </div>
            <div style='padding: 30px; background: #fff;'>
                <p>Gentile {$firstName},</p>
                <p>Il tuo ordine <strong>{$orderNumber}</strong> è stato consegnato con successo!</p>
                <p>Speriamo che tu sia soddisfatto del tuo acquisto. Se hai domande o necessiti di assistenza, non esitare a contattarci.</p>
                <p>Grazie per aver scelto Gaurosa Gioielli!</p>
            </div>
            <div style='background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;'>
                <p>Gaurosa Gioielli - gaurosa.it</p>
            </div>
        </body>
        </html>";

        return sendOrderEmail($order['customer_email'], $subject, $htmlBody);
    } catch (Exception $e) {
        error_log("[SyncBack] Errore email consegna: " . $e->getMessage());
        return false;
    }
}
