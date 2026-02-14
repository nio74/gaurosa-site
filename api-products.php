<?php
/**
 * API Prodotti per Frontend
 * 
 * GET /api-products.php
 * Restituisce prodotti per il sito e-commerce con filtri avanzati
 * 
 * Parametri:
 *   ?categoria=gioielli          Categoria principale
 *   ?sottocategoria=bracciale    Sottocategoria
 *   ?search=anello               Ricerca testo
 *   ?material=oro_750,argento_925  Materiale (multiplo, comma-separated)
 *   ?material_color=giallo,bianco  Colore materiale
 *   ?stone_type=diamante           Tipo pietra
 *   ?gender=donna,unisex           Genere
 *   ?brand_id=5,12                 Brand ID
 *   ?price_min=100                 Prezzo minimo
 *   ?price_max=500                 Prezzo massimo
 *   ?tag=novita,offerta            Tag/etichette
 *   ?sort=newest|price_asc|price_desc|name_asc
 *   ?page=1                        Pagina (1-based)
 *   ?limit=12                      Prodotti per pagina
 */

require_once __DIR__ . '/api-config.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// GET: Lista prodotti
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDbConnection();
        
        // ============================================
        // Parametri
        // ============================================
        $category = $_GET['category'] ?? $_GET['categoria'] ?? null;
        $subcategory = $_GET['subcategory'] ?? $_GET['sottocategoria'] ?? null;
        $search = $_GET['search'] ?? null;
        $material = $_GET['material'] ?? null;
        $materialColor = $_GET['material_color'] ?? null;
        $stoneType = $_GET['stone_type'] ?? null;
        $gender = $_GET['gender'] ?? null;
        $brandId = $_GET['brand_id'] ?? null;
        $priceMin = $_GET['price_min'] ?? null;
        $priceMax = $_GET['price_max'] ?? null;
        $tag = $_GET['tag'] ?? null;
        $collection = $_GET['collezione'] ?? $_GET['collection'] ?? null;
        $sort = $_GET['sort'] ?? 'newest';
        
        // Paginazione (page-based, 1-indexed)
        $page = max((int)($_GET['page'] ?? 1), 1);
        $limit = min(max((int)($_GET['limit'] ?? 12), 1), 100);
        $offset = ($page - 1) * $limit;
        
        // ============================================
        // Build WHERE
        // ============================================
        $where = ['p.stock > 0', 'p.is_active = 1'];
        $params = [];
        $joins = [];
        
        // Categoria
        if ($category && $category !== 'all') {
            $where[] = 'p.main_category = :category';
            $params['category'] = $category;
        }
        
        // Sottocategoria (supporta multipli comma-separated)
        if ($subcategory && $subcategory !== 'all') {
            $subcats = array_map('trim', explode(',', $subcategory));
            if (count($subcats) === 1) {
                $where[] = 'p.subcategory = :subcategory';
                $params['subcategory'] = $subcats[0];
            } else {
                $placeholders = [];
                foreach ($subcats as $i => $sc) {
                    $key = "subcat_$i";
                    $placeholders[] = ":$key";
                    $params[$key] = $sc;
                }
                $where[] = 'p.subcategory IN (' . implode(',', $placeholders) . ')';
            }
        }
        
        // Ricerca testo
        if ($search) {
            $where[] = '(p.name LIKE :search OR p.code LIKE :search2 OR p.ean LIKE :search3)';
            $params['search'] = '%' . $search . '%';
            $params['search2'] = '%' . $search . '%';
            $params['search3'] = '%' . $search . '%';
        }
        
        // Materiale (multiplo)
        if ($material) {
            $materials = array_map('trim', explode(',', $material));
            $placeholders = [];
            foreach ($materials as $i => $m) {
                $key = "mat_$i";
                $placeholders[] = ":$key";
                $params[$key] = $m;
            }
            $where[] = 'p.material_primary IN (' . implode(',', $placeholders) . ')';
        }
        
        // Colore materiale (multiplo)
        if ($materialColor) {
            $colors = array_map('trim', explode(',', $materialColor));
            $placeholders = [];
            foreach ($colors as $i => $c) {
                $key = "mcol_$i";
                $placeholders[] = ":$key";
                $params[$key] = $c;
            }
            $where[] = 'p.material_color IN (' . implode(',', $placeholders) . ')';
        }
        
        // Tipo pietra (multiplo)
        if ($stoneType) {
            $stones = array_map('trim', explode(',', $stoneType));
            $placeholders = [];
            foreach ($stones as $i => $s) {
                $key = "stone_$i";
                $placeholders[] = ":$key";
                $params[$key] = $s;
            }
            $where[] = 'p.stone_main_type IN (' . implode(',', $placeholders) . ')';
        }
        
        // Genere (multiplo)
        if ($gender) {
            $genders = array_map('trim', explode(',', $gender));
            $placeholders = [];
            foreach ($genders as $i => $g) {
                $key = "gen_$i";
                $placeholders[] = ":$key";
                $params[$key] = $g;
            }
            $where[] = 'p.gender IN (' . implode(',', $placeholders) . ')';
        }
        
        // Brand (multiplo, per ID)
        if ($brandId) {
            $brands = array_map('trim', explode(',', $brandId));
            $placeholders = [];
            foreach ($brands as $i => $b) {
                $key = "brand_$i";
                $placeholders[] = ":$key";
                $params[$key] = (int)$b;
            }
            $where[] = 'p.brand_id IN (' . implode(',', $placeholders) . ')';
        }
        
        // Range prezzo
        if ($priceMin !== null && $priceMin !== '') {
            $where[] = 'p.price >= :price_min';
            $params['price_min'] = (float)$priceMin;
        }
        if ($priceMax !== null && $priceMax !== '') {
            $where[] = 'p.price <= :price_max';
            $params['price_max'] = (float)$priceMax;
        }
        
        // Tag (multiplo)
        if ($tag) {
            $tags = array_map('trim', explode(',', $tag));
            $placeholders = [];
            foreach ($tags as $i => $t) {
                $key = "tag_$i";
                $placeholders[] = ":$key";
                $params[$key] = $t;
            }
            $where[] = 'EXISTS (
                SELECT 1 FROM product_tags pt 
                JOIN tags tg ON pt.tag_id = tg.id 
                WHERE pt.product_id = p.id AND tg.code IN (' . implode(',', $placeholders) . ')
            )';
        }
        
        // Collezione (per slug)
        if ($collection) {
            $where[] = 'EXISTS (
                SELECT 1 FROM product_collections pc 
                JOIN collections c ON pc.collection_id = c.id 
                WHERE pc.product_id = p.id AND c.slug = :collection AND c.is_active = 1
            )';
            $params['collection'] = $collection;
        }
        
        // ============================================
        // ORDER BY
        // ============================================
        $orderBy = match($sort) {
            'price_asc' => 'p.price ASC',
            'price_desc' => 'p.price DESC',
            'name_asc' => 'p.name ASC',
            'name_desc' => 'p.name DESC',
            default => 'p.created_at DESC', // newest
        };
        
        $whereClause = implode(' AND ', $where);
        
        // ============================================
        // Query prodotti con immagini
        // ============================================
        $sql = "
            SELECT 
                p.id,
                p.mazgest_id,
                p.code,
                p.name,
                p.price,
                p.compare_at_price,
                p.stock,
                p.main_category,
                p.subcategory,
                p.material_primary,
                p.material_color,
                p.stone_main_type,
                p.gender,
                p.brand_id,
                b.name as brand_name,
                p.created_at,
                p.updated_at,
                GROUP_CONCAT(
                    CONCAT(
                        COALESCE(pi.url, ''), '|', 
                        pi.is_primary, '|', 
                        pi.sort_order, '|',
                        COALESCE(pi.url_thumb, ''), '|',
                        COALESCE(pi.blur_data_uri, '')
                    )
                    ORDER BY pi.is_primary DESC, pi.sort_order ASC
                    SEPARATOR ';;'
                ) as images_data
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE $whereClause
            GROUP BY p.id
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $pdo->prepare($sql);
        
        // Bind parametri
        foreach ($params as $key => $value) {
            if (is_int($value)) {
                $stmt->bindValue(':' . $key, $value, PDO::PARAM_INT);
            } elseif (is_float($value)) {
                $stmt->bindValue(':' . $key, $value);
            } else {
                $stmt->bindValue(':' . $key, $value);
            }
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $products = $stmt->fetchAll();
        
        // ============================================
        // Count totale (senza LIMIT)
        // ============================================
        $countSql = "SELECT COUNT(*) as total FROM products p LEFT JOIN brands b ON p.brand_id = b.id WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            if (is_int($value)) {
                $countStmt->bindValue(':' . $key, $value, PDO::PARAM_INT);
            } elseif (is_float($value)) {
                $countStmt->bindValue(':' . $key, $value);
            } else {
                $countStmt->bindValue(':' . $key, $value);
            }
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetch()['total'];
        
        // ============================================
        // Formatta prodotti
        // ============================================
        $formattedProducts = array_map(function($product) {
            // Parse immagini (with optimized versions)
            $images = [];
            if (!empty($product['images_data'])) {
                $imageStrings = explode(';;', $product['images_data']);
                foreach ($imageStrings as $imgString) {
                    $parts = explode('|', $imgString);
                    if (count($parts) >= 3) {
                        $images[] = [
                            'url' => $parts[0],
                            'is_primary' => (bool)$parts[1],
                            'position' => (int)$parts[2],
                            'url_thumb' => !empty($parts[3]) ? $parts[3] : null,
                            'blur_data_uri' => !empty($parts[4]) ? $parts[4] : null,
                        ];
                    }
                }
            }
            
            return [
                'id' => (int)$product['id'],
                'mazgestId' => (int)$product['mazgest_id'],
                'code' => $product['code'],
                'name' => $product['name'],
                'price' => (float)$product['price'],
                'compareAtPrice' => $product['compare_at_price'] ? (float)$product['compare_at_price'] : null,
                'stock' => (int)$product['stock'],
                'inStock' => (int)$product['stock'] > 0,
                'main_category' => $product['main_category'],
                'subcategory' => $product['subcategory'],
                'material_primary' => $product['material_primary'],
                'material_color' => $product['material_color'],
                'stone_main_type' => $product['stone_main_type'],
                'gender' => $product['gender'],
                'brand' => $product['brand_name'],
                'slug' => strtolower($product['code']),
                'images' => $images,
                'createdAt' => $product['created_at'],
                'updatedAt' => $product['updated_at'],
            ];
        }, $products);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'products' => $formattedProducts,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => $total > 0 ? (int)ceil($total / $limit) : 1,
                    'hasMore' => ($page * $limit) < $total,
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Errore API products.php: ' . $e->getMessage());
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nel recupero dei prodotti',
            'message' => IS_LOCAL ? $e->getMessage() : null,
        ], 500);
    }
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
?>
