<?php
/**
 * API Delete Single Product
 *
 * DELETE /api-sync-delete.php?id=123
 * Rimuove un singolo prodotto dal database gaurosa-site (desincronizza)
 *
 * Query param: id (mazgest_id)
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

// Leggi mazgest_id dal query param
$mazgestId = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$mazgestId) {
    jsonResponse(['success' => false, 'error' => 'Parametro id richiesto'], 400);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    // Find product by mazgest_id
    $stmt = $pdo->prepare("SELECT id, code FROM products WHERE mazgest_id = ?");
    $stmt->execute([$mazgestId]);
    $product = $stmt->fetch();

    if (!$product) {
        $pdo->rollBack();
        jsonResponse([
            'success' => true,
            'data' => [
                'deleted' => 0,
                'message' => "Prodotto con mazgest_id=$mazgestId non trovato"
            ]
        ]);
    }

    $productId = $product['id'];
    $productCode = $product['code'];

    // Delete product images
    $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$productId]);

    // Delete product variants
    $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$productId]);

    // Delete product tags
    try {
        $pdo->prepare("DELETE FROM product_tags WHERE product_id = ?")->execute([$productId]);
    } catch (Exception $e) {
        // Table might not exist, ignore
    }

    // Delete product
    $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$productId]);

    // Log the desync
    try {
        $logStmt = $pdo->prepare("
            INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
            VALUES ('products', 'delete', 'success', 1, 1, 0, NULL, NOW(), 0)
        ");
        $logStmt->execute();
    } catch (Exception $e) {
        // Log table might not exist, ignore
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'data' => [
            'deleted' => 1,
            'deleted_code' => $productCode,
            'message' => "Prodotto $productCode rimosso"
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
