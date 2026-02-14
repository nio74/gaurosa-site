<?php
/**
 * API Sync Prodotti
 *
 * POST /api/sync/products.php
 * Riceve prodotti da MazGest e li salva nel database
 *
 * Body JSON: { "products": [...], "api_key": "xxx" }
 */

require_once __DIR__ . '/api-config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// GET: Stato sync
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pdo = getDbConnection();

    // Conta prodotti
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $productCount = $stmt->fetch()['count'];

    // Ultimo sync
    $stmt = $pdo->query("SELECT * FROM sync_logs WHERE type = 'products' ORDER BY started_at DESC LIMIT 1");
    $lastSync = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'data' => [
            'product_count' => (int)$productCount,
            'last_sync' => $lastSync ? [
                'status' => $lastSync['status'],
                'items_processed' => (int)$lastSync['items_processed'],
                'completed_at' => $lastSync['completed_at'],
                'duration_ms' => (int)$lastSync['duration_ms'],
            ] : null,
        ]
    ]);
}

/**
 * Trova o crea Brand dal mazgest_id
 */
function findOrCreateBrand($pdo, $brandId, $brandName) {
    if (!$brandId && !$brandName) return null;

    // Cerca per mazgest_id
    if ($brandId) {
        $stmt = $pdo->prepare("SELECT id FROM brands WHERE mazgest_id = ?");
        $stmt->execute([$brandId]);
        $brand = $stmt->fetch();
        if ($brand) return $brand['id'];
    }

    // Cerca per nome
    if ($brandName) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $brandName));
        $stmt = $pdo->prepare("SELECT id FROM brands WHERE slug = ?");
        $stmt->execute([$slug]);
        $brand = $stmt->fetch();
        if ($brand) return $brand['id'];

        // Crea nuovo brand
        $stmt = $pdo->prepare("INSERT INTO brands (mazgest_id, name, slug, is_active) VALUES (?, ?, ?, 1)");
        $stmt->execute([$brandId, $brandName, $slug]);
        return $pdo->lastInsertId();
    }

    return null;
}

/**
 * Trova o crea Supplier dal mazgest_id
 */
function findOrCreateSupplier($pdo, $supplierId, $supplierName) {
    if (!$supplierId && !$supplierName) return null;

    // Cerca per mazgest_id
    if ($supplierId) {
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE mazgest_id = ?");
        $stmt->execute([$supplierId]);
        $supplier = $stmt->fetch();
        if ($supplier) return $supplier['id'];
    }

    // Cerca per nome
    if ($supplierName) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $supplierName));
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE slug = ?");
        $stmt->execute([$slug]);
        $supplier = $stmt->fetch();
        if ($supplier) return $supplier['id'];

        // Crea nuovo supplier
        $stmt = $pdo->prepare("INSERT INTO suppliers (mazgest_id, name, slug, is_active) VALUES (?, ?, ?, 1)");
        $stmt->execute([$supplierId, $supplierName, $slug]);
        return $pdo->lastInsertId();
    }

    return null;
}

/**
 * Aggiorna contatori FilterValue
 */
function updateFilterValue($pdo, $attributeType, $value) {
    if (!$value) return;

    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $value));

    $stmt = $pdo->prepare("
        INSERT INTO filter_values (attribute_type, value, label, slug, product_count)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE product_count = product_count + 1
    ");
    $stmt->execute([$attributeType, $value, $value, $slug]);
}

// POST: Sync prodotti
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $startTime = microtime(true);

    // Leggi body JSON
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
    }

    // Verifica API key
    $apiKey = $input['api_key'] ?? null;
    if ($apiKey !== SYNC_API_KEY) {
        jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
    }

    $products = $input['products'] ?? [];
    if (!is_array($products)) {
        jsonResponse(['success' => false, 'error' => 'Formato dati non valido'], 400);
    }

    $pdo = getDbConnection();
    $processed = 0;
    $failed = 0;
    $errors = [];

    // Reset filter counts (verranno ricalcolati)
    $pdo->exec("UPDATE filter_values SET product_count = 0");

    foreach ($products as $product) {
        try {
            $pdo->beginTransaction();

            // Trova o crea brand e supplier
            $dbBrandId = findOrCreateBrand($pdo, $product['brand_id'] ?? null, $product['brand_name'] ?? null);
            $dbSupplierId = findOrCreateSupplier($pdo, $product['supplier_id'] ?? null, $product['supplier_name'] ?? null);

            // Upsert prodotto con tutti gli attributi
            $stmt = $pdo->prepare("
                INSERT INTO products (
                    mazgest_id, code, ean, name, slug, description,
                    load_type, main_category, subcategory,
                    brand_id, supplier_id,
                    price, compare_at_price, stock, stock_status,
                    material_primary, material_color, material_weight_grams,
                    stone_main_type, stone_main_carats, stone_main_color, stone_main_clarity, stone_main_cut, stone_main_certificate,
                    stones_secondary_type, stones_secondary_count,
                    pearl_type, pearl_size_mm, pearl_color,
                    size_ring_it, size_bracelet_cm, size_necklace_cm, size_earring_mm,
                    ring_type, ring_style, earring_type, bracelet_type, necklace_type, pendant_type,
                    gender,
                    watch_gender, watch_type, watch_movement,
                    item_condition,
                    seo_title, seo_description,
                    description_it, description_en,
                    is_active, is_featured, synced_at, updated_at
                ) VALUES (
                    :mazgest_id, :code, :ean, :name, :slug, :description,
                    :load_type, :main_category, :subcategory,
                    :brand_id, :supplier_id,
                    :price, :compare_at_price, :stock, :stock_status,
                    :material_primary, :material_color, :material_weight_grams,
                    :stone_main_type, :stone_main_carats, :stone_main_color, :stone_main_clarity, :stone_main_cut, :stone_main_certificate,
                    :stones_secondary_type, :stones_secondary_count,
                    :pearl_type, :pearl_size_mm, :pearl_color,
                    :size_ring_it, :size_bracelet_cm, :size_necklace_cm, :size_earring_mm,
                    :ring_type, :ring_style, :earring_type, :bracelet_type, :necklace_type, :pendant_type,
                    :gender,
                    :watch_gender, :watch_type, :watch_movement,
                    :item_condition,
                    :seo_title, :seo_description,
                    :description_it, :description_en,
                    :is_active, :is_featured, NOW(), NOW()
                )
                ON DUPLICATE KEY UPDATE
                    code = VALUES(code),
                    ean = VALUES(ean),
                    name = VALUES(name),
                    slug = VALUES(slug),
                    description = VALUES(description),
                    load_type = VALUES(load_type),
                    main_category = VALUES(main_category),
                    subcategory = VALUES(subcategory),
                    brand_id = VALUES(brand_id),
                    supplier_id = VALUES(supplier_id),
                    price = VALUES(price),
                    compare_at_price = VALUES(compare_at_price),
                    stock = VALUES(stock),
                    stock_status = VALUES(stock_status),
                    material_primary = VALUES(material_primary),
                    material_color = VALUES(material_color),
                    material_weight_grams = VALUES(material_weight_grams),
                    stone_main_type = VALUES(stone_main_type),
                    stone_main_carats = VALUES(stone_main_carats),
                    stone_main_color = VALUES(stone_main_color),
                    stone_main_clarity = VALUES(stone_main_clarity),
                    stone_main_cut = VALUES(stone_main_cut),
                    stone_main_certificate = VALUES(stone_main_certificate),
                    stones_secondary_type = VALUES(stones_secondary_type),
                    stones_secondary_count = VALUES(stones_secondary_count),
                    pearl_type = VALUES(pearl_type),
                    pearl_size_mm = VALUES(pearl_size_mm),
                    pearl_color = VALUES(pearl_color),
                    size_ring_it = VALUES(size_ring_it),
                    size_bracelet_cm = VALUES(size_bracelet_cm),
                    size_necklace_cm = VALUES(size_necklace_cm),
                    size_earring_mm = VALUES(size_earring_mm),
                    ring_type = VALUES(ring_type),
                    ring_style = VALUES(ring_style),
                    earring_type = VALUES(earring_type),
                    bracelet_type = VALUES(bracelet_type),
                    necklace_type = VALUES(necklace_type),
                    pendant_type = VALUES(pendant_type),
                    gender = VALUES(gender),
                    watch_gender = VALUES(watch_gender),
                    watch_type = VALUES(watch_type),
                    watch_movement = VALUES(watch_movement),
                    item_condition = VALUES(item_condition),
                    seo_title = VALUES(seo_title),
                    seo_description = VALUES(seo_description),
                    description_it = VALUES(description_it),
                    description_en = VALUES(description_en),
                    is_active = VALUES(is_active),
                    is_featured = VALUES(is_featured),
                    synced_at = NOW(),
                    updated_at = NOW()
            ");

            $stmt->execute([
                ':mazgest_id' => $product['id'],
                ':code' => $product['code'],
                ':ean' => $product['ean_code'] ?? null,
                ':name' => $product['name'],
                ':slug' => strtolower(preg_replace('/[^a-z0-9]+/', '-', ($product['name'] ?? '') . '-' . $product['code'])),
                ':description' => $product['description'] ?? null,
                ':load_type' => $product['load_type'] ?? null,
                ':main_category' => $product['main_category'] ?? null,
                ':subcategory' => $product['subcategory'] ?? null,
                ':brand_id' => $dbBrandId,
                ':supplier_id' => $dbSupplierId,
                ':price' => $product['public_price'] ?? 0,
                ':compare_at_price' => $product['compare_at_price'] ?? null,
                ':stock' => $product['stock'] ?? 0,
                ':stock_status' => $product['status'] ?? 'in_stock',
                ':material_primary' => $product['material_primary'] ?? null,
                ':material_color' => $product['material_color'] ?? null,
                ':material_weight_grams' => $product['material_weight_grams'] ?? null,
                ':stone_main_type' => $product['stone_main_type'] ?? null,
                ':stone_main_carats' => $product['stone_main_carats'] ?? null,
                ':stone_main_color' => $product['stone_main_color'] ?? null,
                ':stone_main_clarity' => $product['stone_main_clarity'] ?? null,
                ':stone_main_cut' => $product['stone_main_cut'] ?? null,
                ':stone_main_certificate' => $product['stone_main_certificate'] ?? null,
                ':stones_secondary_type' => $product['stones_secondary_type'] ?? null,
                ':stones_secondary_count' => $product['stones_secondary_count'] ?? null,
                ':pearl_type' => $product['pearl_type'] ?? null,
                ':pearl_size_mm' => $product['pearl_size_mm'] ?? null,
                ':pearl_color' => $product['pearl_color'] ?? null,
                ':size_ring_it' => $product['size_ring_it'] ?? null,
                ':size_bracelet_cm' => $product['size_bracelet_cm'] ?? null,
                ':size_necklace_cm' => $product['size_necklace_cm'] ?? null,
                ':size_earring_mm' => $product['size_earring_mm'] ?? null,
                ':ring_type' => $product['ring_type'] ?? null,
                ':ring_style' => $product['ring_style'] ?? null,
                ':earring_type' => $product['earring_type'] ?? null,
                ':bracelet_type' => $product['bracelet_type'] ?? null,
                ':necklace_type' => $product['necklace_type'] ?? null,
                ':pendant_type' => $product['pendant_type'] ?? null,
                ':gender' => $product['gender'] ?? null,
                ':watch_gender' => $product['watch_gender'] ?? null,
                ':watch_type' => $product['watch_type'] ?? null,
                ':watch_movement' => $product['watch_movement'] ?? null,
                ':item_condition' => $product['item_condition'] ?? 'nuovo',
                ':seo_title' => $product['seo_title'] ?? null,
                ':seo_description' => $product['seo_description'] ?? null,
                ':description_it' => $product['description_it'] ?? null,
                ':description_en' => $product['description_en'] ?? null,
                ':is_active' => ($product['status'] ?? '') === 'in_stock' ? 1 : 0,
                ':is_featured' => $product['is_featured'] ?? 0,
            ]);

            // Trova ID prodotto
            $stmt = $pdo->prepare("SELECT id FROM products WHERE mazgest_id = ?");
            $stmt->execute([$product['id']]);
            $dbProduct = $stmt->fetch();
            $productId = $dbProduct['id'];

            // Aggiorna contatori filtri
            updateFilterValue($pdo, 'main_category', $product['main_category'] ?? null);
            updateFilterValue($pdo, 'subcategory', $product['subcategory'] ?? null);
            updateFilterValue($pdo, 'material_primary', $product['material_primary'] ?? null);
            updateFilterValue($pdo, 'material_color', $product['material_color'] ?? null);
            updateFilterValue($pdo, 'stone_main_type', $product['stone_main_type'] ?? null);
            updateFilterValue($pdo, 'ring_type', $product['ring_type'] ?? null);
            updateFilterValue($pdo, 'gender', $product['gender'] ?? null);
            updateFilterValue($pdo, 'watch_gender', $product['watch_gender'] ?? null);
            updateFilterValue($pdo, 'item_condition', $product['item_condition'] ?? null);

            // Sync immagini
            if (!empty($product['images'])) {
                // Delete old image files from disk before re-syncing
                $safeCode = preg_replace('/[^a-zA-Z0-9\-_]/', '', $product['code']);
                $imageDir = __DIR__ . '/uploads/products/' . $safeCode;
                if (is_dir($imageDir)) {
                    $oldFiles = glob($imageDir . '/*');
                    foreach ($oldFiles as $oldFile) {
                        if (is_file($oldFile)) {
                            unlink($oldFile);
                        }
                    }
                }

                // Elimina immagini esistenti dal DB
                $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$productId]);

                // Inserisci nuove
                $imgStmt = $pdo->prepare("
                    INSERT INTO product_images (product_id, url, is_primary, sort_order)
                    VALUES (?, ?, ?, ?)
                ");
                foreach ($product['images'] as $img) {
                    $url = $img['url'];
                    if (strpos($url, 'http') !== 0) {
                        $url = 'https://api.mazgest.org' . $url;
                    }
                    $imgStmt->execute([
                        $productId,
                        $url,
                        $img['is_primary'] ?? 0,
                        $img['sort_order'] ?? 0,
                    ]);
                }
            }

            // Sync varianti
            if (!empty($product['variants'])) {
                // Elimina varianti esistenti
                $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$productId]);

                // Inserisci nuove
                $varStmt = $pdo->prepare("
                    INSERT INTO product_variants (
                        product_id, mazgest_variant_id, sku, name,
                        attribute_name, attribute_value, is_virtual,
                        parent_variant_id, price, stock
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($product['variants'] as $variant) {
                    $varStmt->execute([
                        $productId,
                        $variant['id'] ?? null,
                        $variant['sku'] ?? null,
                        $variant['name'] ?? null,
                        $variant['attribute_name'] ?? null,
                        $variant['attribute_value'] ?? null,
                        $variant['is_virtual'] ?? 0,
                        $variant['parent_variant_id'] ?? null,
                        $variant['price'] ?? null,
                        $variant['stock'] ?? 0,
                    ]);
                }
            }

            // Sync collezione
            // Remove old collection assignments for this product
            $pdo->prepare("DELETE FROM product_collections WHERE product_id = ?")->execute([$productId]);

            if (!empty($product['collection'])) {
                $col = $product['collection'];
                $colSlug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $col['name']));

                // Find or create collection
                $colStmt = $pdo->prepare("SELECT id FROM collections WHERE slug = ?");
                $colStmt->execute([$colSlug]);
                $existingCol = $colStmt->fetch();

                if ($existingCol) {
                    $collectionId = $existingCol['id'];
                    // Update collection name/description
                    $pdo->prepare("UPDATE collections SET name = ?, description = ?, updated_at = NOW() WHERE id = ?")
                        ->execute([$col['name'], $col['description'] ?? null, $collectionId]);
                } else {
                    // Create new collection
                    $pdo->prepare("
                        INSERT INTO collections (name, slug, description, is_active, is_featured, position, created_at, updated_at)
                        VALUES (?, ?, ?, 1, 0, 0, NOW(), NOW())
                    ")->execute([$col['name'], $colSlug, $col['description'] ?? null]);
                    $collectionId = $pdo->lastInsertId();
                }

                // Assign product to collection
                $pdo->prepare("
                    INSERT INTO product_collections (product_id, collection_id, added_at)
                    VALUES (?, ?, NOW())
                ")->execute([$productId, $collectionId]);
            }

            $pdo->commit();
            $processed++;

        } catch (Exception $e) {
            $pdo->rollBack();
            $failed++;
            $errors[] = "Prodotto {$product['code']}: " . $e->getMessage();
        }
    }

    $durationMs = (int)((microtime(true) - $startTime) * 1000);

    // Rimuovi filtri vuoti
    $pdo->exec("DELETE FROM filter_values WHERE product_count = 0");

    // Log sync
    $logStmt = $pdo->prepare("
        INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
        VALUES ('products', 'pull', ?, ?, ?, ?, ?, NOW(), ?)
    ");
    $status = $failed === 0 ? 'success' : ($failed < count($products) ? 'partial' : 'error');
    $logStmt->execute([
        $status,
        count($products),
        $processed,
        $failed,
        count($errors) > 0 ? implode("\n", $errors) : null,
        $durationMs,
    ]);

    jsonResponse([
        'success' => $failed < count($products),
        'data' => [
            'total' => count($products),
            'processed' => $processed,
            'failed' => $failed,
            'duration_ms' => $durationMs,
            'errors' => count($errors) > 0 ? $errors : null,
        ]
    ]);
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
