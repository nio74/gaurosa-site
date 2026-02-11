<?php
/**
 * API Filtri Prodotti
 * 
 * GET /api-filters.php
 * Restituisce i filtri disponibili con conteggi prodotti
 * 
 * Parametri opzionali (per conteggi contestuali):
 *   ?categoria=gioielli
 *   ?sottocategoria=bracciale
 *   ?material=oro_750
 *   ?material_color=giallo
 *   ?stone_type=diamante
 *   ?gender=donna
 *   ?brand_id=5
 *   ?price_min=100
 *   ?price_max=500
 *   ?tag=novita
 */

require_once __DIR__ . '/api-config.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

try {
    $pdo = getDbConnection();
    
    // ============================================
    // Parametri filtro attivi (per conteggi contestuali)
    // ============================================
    $activeFilters = [
        'categoria' => $_GET['categoria'] ?? $_GET['category'] ?? null,
        'sottocategoria' => $_GET['sottocategoria'] ?? $_GET['subcategory'] ?? null,
        'material' => $_GET['material'] ?? null,
        'material_color' => $_GET['material_color'] ?? null,
        'stone_type' => $_GET['stone_type'] ?? null,
        'gender' => $_GET['gender'] ?? null,
        'brand_id' => $_GET['brand_id'] ?? null,
        'price_min' => $_GET['price_min'] ?? null,
        'price_max' => $_GET['price_max'] ?? null,
        'tag' => $_GET['tag'] ?? null,
    ];
    
    /**
     * Build WHERE clause excluding a specific filter (for contextual counts)
     * When counting values for filter X, we exclude filter X from the WHERE
     * so the user sees how many products each value would return
     */
    function buildWhereClause($activeFilters, $excludeFilter = null) {
        $where = ['p.stock > 0', 'p.is_active = 1'];
        $params = [];
        
        if ($excludeFilter !== 'categoria' && $activeFilters['categoria']) {
            $where[] = 'p.main_category = :cat';
            $params['cat'] = $activeFilters['categoria'];
        }
        
        if ($excludeFilter !== 'sottocategoria' && $activeFilters['sottocategoria']) {
            $where[] = 'p.subcategory = :subcat';
            $params['subcat'] = $activeFilters['sottocategoria'];
        }
        
        if ($excludeFilter !== 'material' && $activeFilters['material']) {
            // Support multiple values comma-separated
            $materials = explode(',', $activeFilters['material']);
            $placeholders = [];
            foreach ($materials as $i => $m) {
                $key = "mat_$i";
                $placeholders[] = ":$key";
                $params[$key] = trim($m);
            }
            $where[] = 'p.material_primary IN (' . implode(',', $placeholders) . ')';
        }
        
        if ($excludeFilter !== 'material_color' && $activeFilters['material_color']) {
            $colors = explode(',', $activeFilters['material_color']);
            $placeholders = [];
            foreach ($colors as $i => $c) {
                $key = "mcol_$i";
                $placeholders[] = ":$key";
                $params[$key] = trim($c);
            }
            $where[] = 'p.material_color IN (' . implode(',', $placeholders) . ')';
        }
        
        if ($excludeFilter !== 'stone_type' && $activeFilters['stone_type']) {
            $stones = explode(',', $activeFilters['stone_type']);
            $placeholders = [];
            foreach ($stones as $i => $s) {
                $key = "stone_$i";
                $placeholders[] = ":$key";
                $params[$key] = trim($s);
            }
            $where[] = 'p.stone_main_type IN (' . implode(',', $placeholders) . ')';
        }
        
        if ($excludeFilter !== 'gender' && $activeFilters['gender']) {
            $genders = explode(',', $activeFilters['gender']);
            $placeholders = [];
            foreach ($genders as $i => $g) {
                $key = "gen_$i";
                $placeholders[] = ":$key";
                $params[$key] = trim($g);
            }
            $where[] = 'p.gender IN (' . implode(',', $placeholders) . ')';
        }
        
        if ($excludeFilter !== 'brand_id' && $activeFilters['brand_id']) {
            $brands = explode(',', $activeFilters['brand_id']);
            $placeholders = [];
            foreach ($brands as $i => $b) {
                $key = "brand_$i";
                $placeholders[] = ":$key";
                $params[$key] = (int)trim($b);
            }
            $where[] = 'p.brand_id IN (' . implode(',', $placeholders) . ')';
        }
        
        if ($excludeFilter !== 'price' && $activeFilters['price_min']) {
            $where[] = 'p.price >= :price_min';
            $params['price_min'] = (float)$activeFilters['price_min'];
        }
        
        if ($excludeFilter !== 'price' && $activeFilters['price_max']) {
            $where[] = 'p.price <= :price_max';
            $params['price_max'] = (float)$activeFilters['price_max'];
        }
        
        if ($excludeFilter !== 'tag' && $activeFilters['tag']) {
            $tags = explode(',', $activeFilters['tag']);
            $placeholders = [];
            foreach ($tags as $i => $t) {
                $key = "tag_$i";
                $placeholders[] = ":$key";
                $params[$key] = trim($t);
            }
            $where[] = 'EXISTS (SELECT 1 FROM product_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.product_id = p.id AND t.code IN (' . implode(',', $placeholders) . '))';
        }
        
        return [
            'sql' => implode(' AND ', $where),
            'params' => $params,
        ];
    }
    
    /**
     * Helper: execute a count query for a specific attribute
     */
    function getAttributeCounts($pdo, $column, $activeFilters, $excludeFilter) {
        $clause = buildWhereClause($activeFilters, $excludeFilter);
        
        $sql = "
            SELECT $column as value, COUNT(*) as count
            FROM products p
            WHERE {$clause['sql']} AND $column IS NOT NULL AND $column != ''
            GROUP BY $column
            ORDER BY count DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($clause['params']);
        return $stmt->fetchAll();
    }
    
    // ============================================
    // 1. SOTTOCATEGORIE
    // ============================================
    $subcategories = getAttributeCounts($pdo, 'subcategory', $activeFilters, 'sottocategoria');
    
    // ============================================
    // 2. MATERIALE PRIMARIO
    // ============================================
    $materials = getAttributeCounts($pdo, 'material_primary', $activeFilters, 'material');
    
    // ============================================
    // 3. COLORE MATERIALE
    // ============================================
    $materialColors = getAttributeCounts($pdo, 'material_color', $activeFilters, 'material_color');
    
    // ============================================
    // 4. GENERE
    // ============================================
    $genders = getAttributeCounts($pdo, 'gender', $activeFilters, 'gender');
    
    // ============================================
    // 5. TIPO PIETRA
    // ============================================
    $stoneTypes = getAttributeCounts($pdo, 'stone_main_type', $activeFilters, 'stone_type');
    
    // ============================================
    // 6. BRAND
    // ============================================
    $brandClause = buildWhereClause($activeFilters, 'brand_id');
    $brandSql = "
        SELECT b.id, b.name, COUNT(*) as count
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        WHERE {$brandClause['sql']} AND p.brand_id IS NOT NULL
        GROUP BY b.id, b.name
        ORDER BY count DESC
    ";
    $brandStmt = $pdo->prepare($brandSql);
    $brandStmt->execute($brandClause['params']);
    $brands = $brandStmt->fetchAll();
    
    // ============================================
    // 7. RANGE PREZZO (min/max globale)
    // ============================================
    $priceClause = buildWhereClause($activeFilters, 'price');
    $priceSql = "
        SELECT 
            MIN(p.price) as min_price, 
            MAX(p.price) as max_price,
            AVG(p.price) as avg_price
        FROM products p
        WHERE {$priceClause['sql']} AND p.price > 0
    ";
    $priceStmt = $pdo->prepare($priceSql);
    $priceStmt->execute($priceClause['params']);
    $priceRange = $priceStmt->fetch();
    
    // ============================================
    // 8. TAGS
    // ============================================
    $tagClause = buildWhereClause($activeFilters, 'tag');
    $tagSql = "
        SELECT t.code, t.label, t.color, t.icon, t.type, COUNT(pt.product_id) as count
        FROM tags t
        JOIN product_tags pt ON t.id = pt.tag_id
        JOIN products p ON pt.product_id = p.id
        WHERE {$tagClause['sql']} AND t.is_active = 1
        GROUP BY t.id, t.code, t.label, t.color, t.icon, t.type
        ORDER BY count DESC
    ";
    $tagStmt = $pdo->prepare($tagSql);
    $tagStmt->execute($tagClause['params']);
    $tags = $tagStmt->fetchAll();
    
    // ============================================
    // 9. CONDIZIONE
    // ============================================
    $conditions = getAttributeCounts($pdo, 'item_condition', $activeFilters, 'item_condition');
    
    // ============================================
    // TOTALE PRODOTTI con filtri attivi
    // ============================================
    $totalClause = buildWhereClause($activeFilters);
    $totalSql = "SELECT COUNT(*) as total FROM products p WHERE {$totalClause['sql']}";
    $totalStmt = $pdo->prepare($totalSql);
    $totalStmt->execute($totalClause['params']);
    $totalFiltered = $totalStmt->fetch()['total'];
    
    // ============================================
    // RISPOSTA
    // NOTE: sottocategoria is handled by header navigation, not sidebar filters
    // NOTE: brand is removed because the site only sells Gaurosa products
    // ============================================
    jsonResponse([
        'success' => true,
        'data' => [
            'filters' => [
                [
                    'code' => 'material',
                    'label' => 'Materiale',
                    'type' => 'checkbox',
                    'values' => array_map(function($row) {
                        return [
                            'value' => $row['value'],
                            'count' => (int)$row['count'],
                        ];
                    }, $materials),
                ],
                [
                    'code' => 'material_color',
                    'label' => 'Colore',
                    'type' => 'color',
                    'values' => array_map(function($row) {
                        return [
                            'value' => $row['value'],
                            'count' => (int)$row['count'],
                        ];
                    }, $materialColors),
                ],
                [
                    'code' => 'stone_type',
                    'label' => 'Pietra',
                    'type' => 'checkbox',
                    'values' => array_map(function($row) {
                        return [
                            'value' => $row['value'],
                            'count' => (int)$row['count'],
                        ];
                    }, $stoneTypes),
                ],
                [
                    'code' => 'gender',
                    'label' => 'Genere',
                    'type' => 'checkbox',
                    'values' => array_map(function($row) {
                        return [
                            'value' => $row['value'],
                            'count' => (int)$row['count'],
                        ];
                    }, $genders),
                ],
                [
                    'code' => 'tag',
                    'label' => 'Etichette',
                    'type' => 'tag',
                    'values' => array_map(function($row) {
                        return [
                            'value' => $row['code'],
                            'label' => $row['label'],
                            'color' => $row['color'],
                            'icon' => $row['icon'],
                            'count' => (int)$row['count'],
                        ];
                    }, $tags),
                ],
            ],
            'price_range' => [
                'min' => (float)($priceRange['min_price'] ?? 0),
                'max' => (float)($priceRange['max_price'] ?? 10000),
                'avg' => (float)($priceRange['avg_price'] ?? 500),
            ],
            'total_filtered' => (int)$totalFiltered,
        ],
    ]);
    
} catch (Exception $e) {
    error_log('Errore API filters.php: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel recupero dei filtri',
        'message' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}
