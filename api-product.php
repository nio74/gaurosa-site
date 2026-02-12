<?php
/**
 * API Dettaglio Singolo Prodotto
 * 
 * GET /api/product.php?code=XXX
 * Restituisce tutti i dettagli di un prodotto per la pagina dettaglio
 */

require_once __DIR__ . '/api-config.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

// Parametro obbligatorio
$code = $_GET['code'] ?? null;
if (!$code) {
    jsonResponse(['success' => false, 'error' => 'Codice prodotto richiesto'], 400);
}

try {
    $pdo = getDbConnection();
    
    // Query prodotto principale
    $sql = "
        SELECT 
            p.*,
            b.name as brand_name,
            s.name as supplier_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.code = :code OR p.slug = :slug
        LIMIT 1
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['code' => $code, 'slug' => $code]);
    $product = $stmt->fetch();
    
    if (!$product) {
        jsonResponse(['success' => false, 'error' => 'Prodotto non trovato'], 404);
    }
    
    // Query immagini (include optimized versions)
    $imgStmt = $pdo->prepare("
        SELECT url, url_medium, url_thumb, blur_data_uri, is_primary, sort_order 
        FROM product_images 
        WHERE product_id = :productId 
        ORDER BY is_primary DESC, sort_order ASC
    ");
    $imgStmt->execute(['productId' => $product['id']]);
    $images = $imgStmt->fetchAll();
    
    // Query varianti
    $varStmt = $pdo->prepare("
        SELECT id, mazgest_variant_id, sku, name, attribute_name, attribute_value, 
               is_virtual, parent_variant_id, price, stock
        FROM product_variants 
        WHERE product_id = :productId
        ORDER BY attribute_value ASC
    ");
    $varStmt->execute(['productId' => $product['id']]);
    $variants = $varStmt->fetchAll();
    
    // Query tags
    $tagStmt = $pdo->prepare("
        SELECT t.code, t.label, t.color, t.icon, t.type
        FROM product_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.product_id = :productId AND t.is_active = 1
        ORDER BY t.sort_order ASC
    ");
    $tagStmt->execute(['productId' => $product['id']]);
    $tags = $tagStmt->fetchAll();
    
    // Formatta risposta
    $response = [
        'id' => (int)$product['id'],
        'code' => $product['code'],
        'ean' => $product['ean'],
        'name' => $product['name'],
        'slug' => $product['slug'],
        'description' => $product['description'],
        'load_type' => $product['load_type'],
        'main_category' => $product['main_category'],
        'subcategory' => $product['subcategory'],
        'supplier' => $product['supplier_name'] ?? '',
        'brand' => $product['brand_name'] ?? '',
        'price' => (float)$product['price'],
        'compare_at_price' => $product['compare_at_price'] ? (float)$product['compare_at_price'] : null,
        
        // Stock
        'stock' => [
            'total' => (int)$product['stock'],
            'available' => (int)$product['stock'] > 0,
            'status' => $product['stock_status'],
        ],
        
        // Immagini (with optimized versions)
        'images' => array_map(function($img) {
            return [
                'url' => $img['url'],
                'url_medium' => $img['url_medium'] ?? null,
                'url_thumb' => $img['url_thumb'] ?? null,
                'blur_data_uri' => $img['blur_data_uri'] ?? null,
                'is_primary' => (bool)$img['is_primary'],
                'position' => (int)$img['sort_order'],
            ];
        }, $images),
        
        // Varianti
        'variants' => array_map(function($v) {
            return [
                'id' => (int)$v['id'],
                'sku' => $v['sku'],
                'name' => $v['name'],
                'attribute_name' => $v['attribute_name'],
                'size' => $v['attribute_value'],
                'is_virtual' => (bool)$v['is_virtual'],
                'price' => $v['price'] ? (float)$v['price'] : null,
                'stock' => (int)$v['stock'],
            ];
        }, $variants),
        
        // Attributi
        'attributes' => [
            // Materiale
            'material_primary' => $product['material_primary'],
            'material_color' => $product['material_color'],
            'material_weight_grams' => $product['material_weight_grams'] ? (float)$product['material_weight_grams'] : null,
            
            // Pietre
            'stone_main_type' => $product['stone_main_type'],
            'stone_main_carats' => $product['stone_main_carats'] ? (float)$product['stone_main_carats'] : null,
            'stone_main_color' => $product['stone_main_color'],
            'stone_main_clarity' => $product['stone_main_clarity'],
            'stone_main_cut' => $product['stone_main_cut'],
            'stone_main_certificate' => $product['stone_main_certificate'],
            'stones_secondary_type' => $product['stones_secondary_type'],
            'stones_secondary_count' => $product['stones_secondary_count'] ? (int)$product['stones_secondary_count'] : null,
            
            // Perle
            'pearl_type' => $product['pearl_type'],
            'pearl_size_mm' => $product['pearl_size_mm'] ? (float)$product['pearl_size_mm'] : null,
            'pearl_color' => $product['pearl_color'],
            
            // Misure
            'size_ring_it' => $product['size_ring_it'] ? (int)$product['size_ring_it'] : null,
            'size_bracelet_cm' => $product['size_bracelet_cm'] ? (float)$product['size_bracelet_cm'] : null,
            'size_necklace_cm' => $product['size_necklace_cm'] ? (int)$product['size_necklace_cm'] : null,
            'size_earring_mm' => $product['size_earring_mm'] ? (float)$product['size_earring_mm'] : null,
            
            // Tipi specifici
            'ring_type' => $product['ring_type'],
            'ring_style' => $product['ring_style'],
            'earring_type' => $product['earring_type'],
            'bracelet_type' => $product['bracelet_type'],
            'necklace_type' => $product['necklace_type'],
            'pendant_type' => $product['pendant_type'],
            
            // Genere
            'gender' => $product['gender'],
            
            // Condizione
            'item_condition' => $product['item_condition'],
        ],
        
        // Tags
        'tags' => array_map(function($t) {
            return [
                'code' => $t['code'],
                'label' => $t['label'],
                'color' => $t['color'],
                'icon' => $t['icon'],
            ];
        }, $tags),
        
        // SEO
        'seo_title' => $product['seo_title'],
        'seo_description' => $product['seo_description'],
        'description_it' => $product['description_it'],
        'description_en' => $product['description_en'],
    ];
    
    jsonResponse([
        'success' => true,
        'data' => $response,
    ]);
    
} catch (Exception $e) {
    error_log('Errore API product.php: ' . $e->getMessage());
    jsonResponse([
        'success' => false, 
        'error' => 'Errore nel recupero del prodotto',
        'message' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}
