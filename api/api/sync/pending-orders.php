<?php
/**
 * API Sync - GET /api/sync/pending-orders.php
 * 
 * Returns orders that need to be synced to MazGest.
 * Called by MazGest PULL system to import new orders.
 * 
 * Returns orders that:
 * - Have payment_status = 'paid' OR 'awaiting_payment' (bank transfers)
 * - Have sent_to_mazgest = 0 (not yet synced)
 * 
 * Query params:
 * - limit: max orders to return (default 50)
 * 
 * Requires x-api-key header for authentication.
 */

require_once __DIR__ . '/../config.php';

// Only GET
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Verify API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== SYNC_API_KEY && $apiKey !== MAZGEST_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

try {
    $pdo = getDbConnection();
    $limit = min(intval($_GET['limit'] ?? 50), 200);

    // Get paid orders not yet synced to MazGest
    $stmt = $pdo->prepare("
        SELECT 
            o.id, o.order_number, o.customer_id, o.customer_email, o.customer_name, o.customer_phone,
            o.is_guest, o.status, o.payment_status,
            o.requires_invoice, o.invoice_type, o.invoice_ragione_sociale, o.invoice_codice_fiscale,
            o.invoice_partita_iva, o.invoice_codice_sdi, o.invoice_pec,
            o.billing_address, o.shipping_address,
            o.subtotal, o.shipping_total, o.tax_total, o.discount_total, o.total,
            o.payment_method, o.payment_id, o.payment_reference,
            o.shipping_method, o.tracking_number, o.tracking_url,
            o.customer_notes, o.internal_notes,
            o.created_at, o.paid_at
        FROM orders o
        WHERE o.payment_status IN ('paid', 'awaiting_payment')
          AND o.sent_to_mazgest = 0
        ORDER BY o.created_at ASC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    $orders = $stmt->fetchAll();

    // For each order, fetch items
    $ordersWithItems = [];
    foreach ($orders as $order) {
        $itemStmt = $pdo->prepare("
            SELECT 
                oi.id, oi.product_code, oi.product_name, oi.variant_sku, oi.variant_name,
                oi.is_virtual_variant, oi.ordered_size,
                oi.quantity, oi.unit_price, oi.total_price
            FROM order_items oi
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        ");
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();

        // Get customer's mazgest_id if they have one
        $mazgestCustomerId = null;
        if ($order['customer_id']) {
            $custStmt = $pdo->prepare("SELECT mazgest_id FROM customers WHERE id = ? LIMIT 1");
            $custStmt->execute([$order['customer_id']]);
            $cust = $custStmt->fetch();
            if ($cust && $cust['mazgest_id']) {
                $mazgestCustomerId = (int)$cust['mazgest_id'];
            }
        }

        $order['items'] = $items;
        $order['mazgest_customer_id'] = $mazgestCustomerId;
        $ordersWithItems[] = $order;
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'orders' => $ordersWithItems,
            'count' => count($ordersWithItems),
            'has_more' => count($ordersWithItems) >= $limit
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in pending-orders.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
