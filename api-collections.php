<?php
/**
 * API Collezioni per Frontend
 * 
 * GET /api-collections.php
 * Restituisce le collezioni attive con conteggio prodotti
 */

require_once __DIR__ . '/api-config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDbConnection();
        
        $sql = "
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.description,
                c.image_url,
                c.is_featured,
                COUNT(pc.product_id) as product_count
            FROM collections c
            LEFT JOIN product_collections pc ON c.id = pc.collection_id
            LEFT JOIN products p ON pc.product_id = p.id AND p.is_active = 1 AND p.stock > 0
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY c.position ASC, c.name ASC
        ";
        
        $stmt = $pdo->query($sql);
        $collections = $stmt->fetchAll();
        
        $formatted = array_map(function($c) {
            return [
                'id' => (int)$c['id'],
                'name' => $c['name'],
                'slug' => $c['slug'],
                'description' => $c['description'],
                'image_url' => $c['image_url'],
                'is_featured' => (bool)$c['is_featured'],
                'product_count' => (int)$c['product_count'],
            ];
        }, $collections);
        
        jsonResponse([
            'success' => true,
            'data' => $formatted,
        ]);
        
    } catch (Exception $e) {
        error_log('Errore API collections: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error' => 'Errore nel recupero delle collezioni',
        ], 500);
    }
}

jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
?>
