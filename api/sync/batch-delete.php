<?php
/**
 * API Batch Delete Products
 *
 * DELETE /api/sync/batch-delete.php
 * Body JSON: { "product_ids": [1, 2, 3] }
 * Elimina multipli prodotti dal database gaurosa.it
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

// Verifica API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

// Leggi body JSON
$input = json_decode(file_get_contents('php://input'), true);
$productIds = $input['product_ids'] ?? [];

if (empty($productIds) || !is_array($productIds)) {
    jsonResponse(['success' => false, 'error' => 'product_ids richiesto (array)'], 400);
}

try {
    $pdo = getDbConnection();
    $deleted = 0;
    $errors = [];

    foreach ($productIds as $mazgestId) {
        try {
            // Trova prodotto
            $stmt = $pdo->prepare("SELECT id FROM products WHERE mazgest_id = ?");
            $stmt->execute([$mazgestId]);
            $product = $stmt->fetch();

            if (!$product) {
                continue; // Prodotto non esiste, skip
            }

            $dbProductId = $product['id'];

            // Elimina immagini
            $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$dbProductId]);

            // Elimina varianti
            $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$dbProductId]);

            // Elimina prodotto
            $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$dbProductId]);

            $deleted++;

        } catch (Exception $e) {
            $errors[] = "Prodotto #{$mazgestId}: " . $e->getMessage();
        }
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'requested' => count($productIds),
            'deleted' => $deleted,
            'errors' => count($errors) > 0 ? $errors : null
        ]
    ]);

} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore database: ' . $e->getMessage()
    ], 500);
}
