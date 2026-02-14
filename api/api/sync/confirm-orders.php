<?php
/**
 * API Sync - POST /api/sync/confirm-orders.php
 * 
 * Called by MazGest after successfully importing orders.
 * Marks orders as synced and stores their MazGest order IDs.
 * 
 * Body (JSON):
 * {
 *   "orders": [
 *     { "siteOrderId": 1, "mazgestOrderId": 42 },
 *     { "siteOrderId": 2, "mazgestOrderId": 43 }
 *   ]
 * }
 * 
 * Requires x-api-key header for authentication.
 */

require_once __DIR__ . '/../config.php';

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
$orders = $data['orders'] ?? [];

if (empty($orders) || !is_array($orders)) {
    jsonResponse(['success' => false, 'error' => 'Array orders richiesto'], 400);
}

try {
    $pdo = getDbConnection();
    
    $updated = 0;
    $errors = [];

    $stmt = $pdo->prepare("
        UPDATE orders 
        SET sent_to_mazgest = 1,
            mazgest_order_id = ?,
            sent_at = NOW(),
            sync_error = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");

    foreach ($orders as $order) {
        $siteId = $order['siteOrderId'] ?? null;
        $mazgestId = $order['mazgestOrderId'] ?? null;

        if (!$siteId || !$mazgestId) {
            $errors[] = "Missing siteOrderId or mazgestOrderId for entry: " . json_encode($order);
            continue;
        }

        try {
            $stmt->execute([$mazgestId, $siteId]);
            if ($stmt->rowCount() > 0) {
                $updated++;
            } else {
                $errors[] = "Order ID $siteId not found in database";
            }
        } catch (Exception $e) {
            $errors[] = "Error updating order $siteId: " . $e->getMessage();
        }
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'updated' => $updated,
            'total' => count($orders),
            'errors' => $errors
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in confirm-orders.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
