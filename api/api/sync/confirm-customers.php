<?php
/**
 * API Sync - POST /api/sync/confirm-customers.php
 * 
 * Called by MazGest after successfully importing customers.
 * Marks customers as synced and stores their MazGest IDs.
 * 
 * Body (JSON):
 * {
 *   "customers": [
 *     { "siteCustomerId": 5, "mazgestId": 169 },
 *     { "siteCustomerId": 6, "mazgestId": 170 }
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
$customers = $data['customers'] ?? [];

if (empty($customers) || !is_array($customers)) {
    jsonResponse(['success' => false, 'error' => 'Array customers richiesto'], 400);
}

try {
    $pdo = getDbConnection();
    
    $updated = 0;
    $errors = [];

    $stmt = $pdo->prepare("
        UPDATE customers 
        SET mazgest_id = ?,
            synced_at = NOW(),
            sync_status = 'synced',
            last_sync_error = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");

    foreach ($customers as $customer) {
        $siteId = $customer['siteCustomerId'] ?? null;
        $mazgestId = $customer['mazgestId'] ?? null;

        if (!$siteId || !$mazgestId) {
            $errors[] = "Missing siteCustomerId or mazgestId for entry: " . json_encode($customer);
            continue;
        }

        try {
            $stmt->execute([$mazgestId, $siteId]);
            if ($stmt->rowCount() > 0) {
                $updated++;
            } else {
                $errors[] = "Customer ID $siteId not found in database";
            }
        } catch (Exception $e) {
            $errors[] = "Error updating customer $siteId: " . $e->getMessage();
        }
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'updated' => $updated,
            'total' => count($customers),
            'errors' => $errors
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in confirm-customers.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
