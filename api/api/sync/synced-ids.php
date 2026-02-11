<?php
/**
 * API Synced IDs
 *
 * GET /api/sync/synced-ids
 * Restituisce la lista dei mazgest_id dei prodotti sincronizzati
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

// Verifica API key (opzionale per questo endpoint di sola lettura)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
// Per sicurezza, potresti voler verificare l'API key anche qui
// if ($apiKey !== SYNC_API_KEY) {
//     jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
// }

try {
    $pdo = getDbConnection();

    // Ottieni tutti i mazgest_id dei prodotti attivi
    $stmt = $pdo->query("SELECT mazgest_id FROM products WHERE mazgest_id IS NOT NULL");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Converti a interi
    $syncedIds = array_map('intval', $rows);

    jsonResponse([
        'success' => true,
        'data' => [
            'synced_ids' => $syncedIds,
            'count' => count($syncedIds)
        ]
    ]);

} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore database: ' . $e->getMessage()
    ], 500);
}
