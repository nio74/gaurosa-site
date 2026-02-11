<?php
/**
 * API Delete Product
 *
 * DELETE /api/sync/delete.php?id=123
 * Elimina un prodotto dal database gaurosa.it
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

// Ottieni ID prodotto
$productId = $_GET['id'] ?? null;
if (!$productId) {
    jsonResponse(['success' => false, 'error' => 'ID prodotto richiesto'], 400);
}

try {
    $pdo = getDbConnection();

    // Trova prodotto
    $stmt = $pdo->prepare("SELECT id FROM products WHERE mazgest_id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(['success' => false, 'error' => 'Prodotto non trovato'], 404);
    }

    $dbProductId = $product['id'];

    // Elimina immagini
    $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$dbProductId]);

    // Elimina varianti
    $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$dbProductId]);

    // Elimina prodotto
    $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$dbProductId]);

    jsonResponse([
        'success' => true,
        'message' => "Prodotto #{$productId} eliminato"
    ]);

} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore database: ' . $e->getMessage()
    ], 500);
}
