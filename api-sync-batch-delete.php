<?php
/**
 * API Batch Delete Products
 *
 * DELETE /api-sync-batch-delete.php
 * Rimuove prodotti multipli dal database gaurosa-site (desincronizza)
 *
 * Body JSON: { "product_ids": [1, 2, 3] }
 * Header: X-Api-Key
 */

require_once __DIR__ . '/api-config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato. Usa DELETE.'], 405);
}

// Verifica API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

// Leggi body JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
}

$productIds = $input['product_ids'] ?? [];

if (!is_array($productIds) || count($productIds) === 0) {
    jsonResponse(['success' => false, 'error' => 'product_ids richiesto (array non vuoto)'], 400);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // Sanitize IDs - only integers
    $cleanIds = array_map('intval', $productIds);
    $placeholders = implode(',', array_fill(0, count($cleanIds), '?'));

    // Get product internal IDs from mazgest_ids
    $stmt = $pdo->prepare("SELECT id, mazgest_id, code FROM products WHERE mazgest_id IN ($placeholders)");
    $stmt->execute($cleanIds);
    $products = $stmt->fetchAll();

    if (count($products) === 0) {
        $pdo->rollBack();
        jsonResponse([
            'success' => true,
            'data' => [
                'deleted' => 0,
                'message' => 'Nessun prodotto trovato con gli ID forniti'
            ]
        ]);
    }

    $internalIds = array_column($products, 'id');
    $deletedCodes = array_column($products, 'code');
    $internalPlaceholders = implode(',', array_fill(0, count($internalIds), '?'));

    // Delete image files from disk for each product
    foreach ($deletedCodes as $code) {
        $imageDir = __DIR__ . '/uploads/products/' . preg_replace('/[^a-zA-Z0-9\-_]/', '', $code);
        if (is_dir($imageDir)) {
            $files = glob($imageDir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($imageDir);
        }
    }

    // Delete product images from DB
    $stmt = $pdo->prepare("DELETE FROM product_images WHERE product_id IN ($internalPlaceholders)");
    $stmt->execute($internalIds);

    // Delete product variants
    $stmt = $pdo->prepare("DELETE FROM product_variants WHERE product_id IN ($internalPlaceholders)");
    $stmt->execute($internalIds);

    // Delete product tags
    try {
        $stmt = $pdo->prepare("DELETE FROM product_tags WHERE product_id IN ($internalPlaceholders)");
        $stmt->execute($internalIds);
    } catch (Exception $e) {
        // Table might not exist, ignore
    }

    // Delete products
    $stmt = $pdo->prepare("DELETE FROM products WHERE id IN ($internalPlaceholders)");
    $stmt->execute($internalIds);
    $deletedCount = $stmt->rowCount();

    // Log the desync
    try {
        $logStmt = $pdo->prepare("
            INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
            VALUES ('products', 'delete', 'success', ?, ?, 0, NULL, NOW(), 0)
        ");
        $logStmt->execute([count($cleanIds), $deletedCount]);
    } catch (Exception $e) {
        // Log table might not exist, ignore
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'data' => [
            'deleted' => $deletedCount,
            'deleted_codes' => $deletedCodes,
            'message' => "Rimossi $deletedCount prodotti"
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'error' => 'Errore database: ' . $e->getMessage()
    ], 500);
}
