<?php
/**
 * API Sync Categorie
 *
 * POST /api/sync/categories.php
 * Riceve categorie da MazGest e le salva nel database
 *
 * Body JSON: { "categories": [...], "api_key": "xxx" }
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// GET: Stato sync categorie
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pdo = getDbConnection();

    // Conta categorie
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories");
    $categoryCount = $stmt->fetch()['count'];

    // Conta sottocategorie
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL");
    $subcategoryCount = $stmt->fetch()['count'];

    // Ultimo sync
    $stmt = $pdo->query("SELECT * FROM sync_logs WHERE type = 'categories' ORDER BY started_at DESC LIMIT 1");
    $lastSync = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'data' => [
            'category_count' => (int)$categoryCount,
            'subcategory_count' => (int)$subcategoryCount,
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
 * Genera slug da nome categoria
 */
function generateCategorySlug($name) {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

// POST: Sync categorie
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

    $categories = $input['categories'] ?? [];
    if (!is_array($categories)) {
        jsonResponse(['success' => false, 'error' => 'Formato dati non valido'], 400);
    }

    $pdo = getDbConnection();
    $processed = 0;
    $failed = 0;
    $errors = [];

    foreach ($categories as $category) {
        try {
            $pdo->beginTransaction();

            // Upsert categoria principale
            $stmt = $pdo->prepare("
                INSERT INTO categories (
                    name, slug, parent_id, position, product_count, 
                    show_in_menu, is_active
                ) VALUES (?, ?, NULL, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    product_count = VALUES(product_count), 
                    position = VALUES(position),
                    show_in_menu = VALUES(show_in_menu),
                    is_active = VALUES(is_active)
            ");
            
            $slug = generateCategorySlug($category['name']);
            $stmt->execute([
                $category['name'],
                $slug,
                $category['position'] ?? 0,
                $category['product_count'] ?? 0,
                $category['show_in_menu'] ?? 1,
                $category['is_active'] ?? 1
            ]);

            // Ottieni ID categoria
            $categoryId = $pdo->lastInsertId();
            if (!$categoryId) {
                $stmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
                $stmt->execute([$slug]);
                $result = $stmt->fetch();
                $categoryId = $result['id'];
            }

            $processed++;

            // Sottocategorie
            if (isset($category['subcategories']) && is_array($category['subcategories'])) {
                foreach ($category['subcategories'] as $subcategory) {
                    $subSlug = generateCategorySlug($subcategory['name']);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO categories (
                            name, slug, parent_id, position, product_count, 
                            show_in_menu, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            product_count = VALUES(product_count), 
                            position = VALUES(position),
                            show_in_menu = VALUES(show_in_menu),
                            is_active = VALUES(is_active)
                    ");
                    
                    $stmt->execute([
                        $subcategory['name'],
                        $subSlug,
                        $categoryId,
                        $subcategory['position'] ?? 0,
                        $subcategory['product_count'] ?? 0,
                        $subcategory['show_in_menu'] ?? 1,
                        $subcategory['is_active'] ?? 1
                    ]);
                    
                    $processed++;
                }
            }

            $pdo->commit();

        } catch (Exception $e) {
            $pdo->rollBack();
            $failed++;
            $errors[] = "Categoria {$category['name']}: " . $e->getMessage();
        }
    }

    $durationMs = (int)((microtime(true) - $startTime) * 1000);

    // Log sync
    $logStmt = $pdo->prepare("
        INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
        VALUES ('categories', 'pull', ?, ?, ?, ?, ?, NOW(), ?)
    ");
    $status = $failed === 0 ? 'success' : ($failed < count($categories) ? 'partial' : 'error');
    $logStmt->execute([
        $status,
        count($categories),
        $processed,
        $failed,
        count($errors) > 0 ? implode("\n", $errors) : null,
        $durationMs,
    ]);

    jsonResponse([
        'success' => $failed < count($categories),
        'data' => [
            'total' => count($categories),
            'processed' => $processed,
            'failed' => $failed,
            'duration_ms' => $durationMs,
            'errors' => count($errors) > 0 ? $errors : null,
        ]
    ]);
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);