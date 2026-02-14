<?php
/**
 * API Ordini Cliente
 * 
 * GET /api/orders - Lista ordini del cliente autenticato
 * GET /api/orders?id=123 - Dettaglio singolo ordine
 * 
 * Richiede autenticazione (cookie JWT).
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth/jwt.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

// Require authentication
$user = requireAuth();
$customerId = (int)$user['id'];

try {
    $pdo = getDbConnection();

    // Check if requesting single order detail
    $orderId = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if ($orderId) {
        // =====================================================
        // DETTAGLIO SINGOLO ORDINE
        // =====================================================

        $stmt = $pdo->prepare("
            SELECT o.*,
                   DATE_FORMAT(o.created_at, '%d/%m/%Y %H:%i') as formatted_date,
                   DATE_FORMAT(o.paid_at, '%d/%m/%Y %H:%i') as formatted_paid_date,
                   DATE_FORMAT(o.shipped_at, '%d/%m/%Y %H:%i') as formatted_shipped_date,
                   DATE_FORMAT(o.completed_at, '%d/%m/%Y %H:%i') as formatted_completed_date
            FROM orders o
            WHERE o.id = :id AND o.customer_id = :customer_id
            LIMIT 1
        ");
        $stmt->execute(['id' => $orderId, 'customer_id' => $customerId]);
        $order = $stmt->fetch();

        if (!$order) {
            jsonResponse(['success' => false, 'error' => 'Ordine non trovato'], 404);
        }

        // Fetch order items
        $itemStmt = $pdo->prepare("
            SELECT oi.*, p.slug as product_slug,
                   (SELECT pi.url_thumb FROM product_images pi 
                    WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 
                    LIMIT 1) as product_thumb,
                   (SELECT pi.url FROM product_images pi 
                    WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 
                    LIMIT 1) as product_image
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = :order_id
            ORDER BY oi.id ASC
        ");
        $itemStmt->execute(['order_id' => $orderId]);
        $items = $itemStmt->fetchAll();

        jsonResponse([
            'success' => true,
            'order' => formatOrderDetail($order, $items),
        ]);

    } else {
        // =====================================================
        // LISTA ORDINI
        // =====================================================

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(5, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        // Count total orders
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as total FROM orders WHERE customer_id = :customer_id
        ");
        $countStmt->execute(['customer_id' => $customerId]);
        $totalOrders = (int)$countStmt->fetch()['total'];

        // Fetch orders
        $stmt = $pdo->prepare("
            SELECT o.id, o.order_number, o.status, o.payment_status,
                   o.subtotal, o.shipping_total, o.total,
                   o.payment_method, o.tracking_number, o.tracking_url,
                   DATE_FORMAT(o.created_at, '%d/%m/%Y') as formatted_date,
                   DATE_FORMAT(o.created_at, '%d/%m/%Y %H:%i') as formatted_datetime,
                   o.created_at,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE o.customer_id = :customer_id
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue('customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll();

        // For each order, get first item thumbnail for preview
        $formattedOrders = [];
        foreach ($orders as $order) {
            // Get first item thumbnail
            $thumbStmt = $pdo->prepare("
                SELECT oi.product_name,
                       (SELECT pi.url_thumb FROM product_images pi 
                        WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 
                        LIMIT 1) as product_thumb,
                       (SELECT pi.url FROM product_images pi 
                        WHERE pi.product_id = oi.product_id AND pi.is_primary = 1 
                        LIMIT 1) as product_image
                FROM order_items oi
                WHERE oi.order_id = :order_id
                ORDER BY oi.id ASC
                LIMIT 3
            ");
            $thumbStmt->execute(['order_id' => $order['id']]);
            $previews = $thumbStmt->fetchAll();

            $formattedOrders[] = [
                'id' => (int)$order['id'],
                'orderNumber' => $order['order_number'],
                'status' => $order['status'],
                'paymentStatus' => $order['payment_status'],
                'subtotal' => (float)$order['subtotal'],
                'shippingTotal' => (float)$order['shipping_total'],
                'total' => (float)$order['total'],
                'paymentMethod' => $order['payment_method'],
                'trackingNumber' => $order['tracking_number'],
                'trackingUrl' => $order['tracking_url'],
                'date' => $order['formatted_date'],
                'datetime' => $order['formatted_datetime'],
                'itemCount' => (int)$order['item_count'],
                'previews' => array_map(function($p) {
                    return [
                        'name' => $p['product_name'],
                        'thumb' => $p['product_thumb'] ?: $p['product_image'],
                    ];
                }, $previews),
            ];
        }

        jsonResponse([
            'success' => true,
            'orders' => $formattedOrders,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalOrders,
                'totalPages' => ceil($totalOrders / $limit),
            ],
        ]);
    }

} catch (Exception $e) {
    error_log('❌ Errore API orders: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel recupero degli ordini',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format order detail for API response
 */
function formatOrderDetail($order, $items) {
    $shippingAddress = json_decode($order['shipping_address'] ?? '{}', true) ?: [];
    $billingAddress = json_decode($order['billing_address'] ?? '{}', true) ?: [];

    return [
        'id' => (int)$order['id'],
        'orderNumber' => $order['order_number'],
        'status' => $order['status'],
        'paymentStatus' => $order['payment_status'],
        'date' => $order['formatted_date'],
        'paidDate' => $order['formatted_paid_date'],
        'shippedDate' => $order['formatted_shipped_date'],
        'completedDate' => $order['formatted_completed_date'],

        // Totals
        'subtotal' => (float)$order['subtotal'],
        'shippingTotal' => (float)$order['shipping_total'],
        'taxTotal' => (float)$order['tax_total'],
        'discountTotal' => (float)$order['discount_total'],
        'total' => (float)$order['total'],

        // Payment
        'paymentMethod' => $order['payment_method'],

        // Shipping
        'shippingMethod' => $order['shipping_method'],
        'trackingNumber' => $order['tracking_number'],
        'trackingUrl' => $order['tracking_url'],
        'shippingAddress' => $shippingAddress,
        'billingAddress' => $billingAddress,

        // Invoice
        'requiresInvoice' => (bool)$order['requires_invoice'],
        'invoiceType' => $order['invoice_type'],
        'invoiceNumber' => $order['invoice_number'],

        // Notes
        'customerNotes' => $order['customer_notes'],

        // Items
        'items' => array_map(function($item) {
            return [
                'id' => (int)$item['id'],
                'productCode' => $item['product_code'],
                'productName' => $item['product_name'],
                'productSlug' => $item['product_slug'] ?? null,
                'variantSku' => $item['variant_sku'],
                'variantName' => $item['variant_name'],
                'orderedSize' => $item['ordered_size'],
                'quantity' => (int)$item['quantity'],
                'unitPrice' => (float)$item['unit_price'],
                'totalPrice' => (float)$item['total_price'],
                'thumb' => $item['product_thumb'] ?: $item['product_image'] ?: null,
            ];
        }, $items),
    ];
}
