<?php
/**
 * Debug Schema Database
 * Mostra la struttura delle tabelle per identificare discrepanze
 */

require_once __DIR__ . '/config.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

try {
    $pdo = getDbConnection();
    
    // Mostra struttura tabella products
    $stmt = $pdo->query("DESCRIBE products");
    $productsSchema = $stmt->fetchAll();
    
    // Mostra primi 2 prodotti per vedere i dati
    $stmt = $pdo->query("SELECT * FROM products LIMIT 2");
    $sampleProducts = $stmt->fetchAll();
    
    // Mostra tabelle esistenti
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    jsonResponse([
        'success' => true,
        'data' => [
            'tables' => $tables,
            'products_schema' => $productsSchema,
            'sample_products' => $sampleProducts,
        ]
    ]);
    
} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore debug schema',
        'message' => $e->getMessage()
    ], 500);
}