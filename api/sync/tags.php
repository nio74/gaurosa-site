<?php
/**
 * API Sync Tag
 *
 * POST /api/sync/tags.php
 * Riceve tag da MazGest e li salva nel database
 *
 * Body JSON: { "tags": [...], "api_key": "xxx" }
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// GET: Stato sync tag
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pdo = getDbConnection();

    // Conta tag
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tags");
    $tagCount = $stmt->fetch()['count'];

    // Conta per tipo
    $stmt = $pdo->query("SELECT type, COUNT(*) as count FROM tags GROUP BY type");
    $byType = [];
    while ($row = $stmt->fetch()) {
        $byType[$row['type']] = (int)$row['count'];
    }

    // Ultimo sync
    $stmt = $pdo->query("SELECT * FROM sync_logs WHERE type = 'tags' ORDER BY started_at DESC LIMIT 1");
    $lastSync = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'data' => [
            'tag_count' => (int)$tagCount,
            'by_type' => $byType,
            'last_sync' => $lastSync ? [
                'status' => $lastSync['status'],
                'items_processed' => (int)$lastSync['items_processed'],
                'completed_at' => $lastSync['completed_at'],
                'duration_ms' => (int)$lastSync['duration_ms'],
            ] : null,
        ]
    ]);
}

// POST: Sync tag
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

    $tags = $input['tags'] ?? [];
    if (!is_array($tags)) {
        jsonResponse(['success' => false, 'error' => 'Formato dati non valido'], 400);
    }

    $pdo = getDbConnection();
    $synced = 0;
    $failed = 0;
    $errors = [];

    foreach ($tags as $tag) {
        try {
            $pdo->beginTransaction();

            // Upsert tag
            $stmt = $pdo->prepare("
                INSERT INTO tags (
                    code, label, slug, type, description, color, icon, 
                    sort_order, product_count, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    label = VALUES(label),
                    product_count = VALUES(product_count),
                    color = VALUES(color),
                    icon = VALUES(icon),
                    sort_order = VALUES(sort_order),
                    is_active = VALUES(is_active)
            ");
            
            $stmt->execute([
                $tag['code'],
                $tag['label'],
                $tag['slug'],
                $tag['type'],
                $tag['description'] ?? null,
                $tag['color'] ?? null,
                $tag['icon'] ?? null,
                $tag['sort_order'] ?? 0,
                $tag['product_count'] ?? 0,
                $tag['is_active'] ?? 1
            ]);

            $pdo->commit();
            $synced++;

        } catch (Exception $e) {
            $pdo->rollBack();
            $failed++;
            $errors[] = "Tag {$tag['code']}: " . $e->getMessage();
        }
    }

    $durationMs = (int)((microtime(true) - $startTime) * 1000);

    // Log sync
    $logStmt = $pdo->prepare("
        INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
        VALUES ('tags', 'pull', ?, ?, ?, ?, ?, NOW(), ?)
    ");
    $status = $failed === 0 ? 'success' : ($failed < count($tags) ? 'partial' : 'error');
    $logStmt->execute([
        $status,
        count($tags),
        $synced,
        $failed,
        count($errors) > 0 ? implode("\n", $errors) : null,
        $durationMs,
    ]);

    jsonResponse([
        'success' => $failed < count($tags),
        'data' => [
            'total' => count($tags),
            'synced' => $synced,
            'failed' => $failed,
            'duration_ms' => $durationMs,
            'errors' => count($errors) > 0 ? $errors : null,
        ]
    ]);
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
