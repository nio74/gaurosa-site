<?php
/**
 * API Sync Attributi
 *
 * POST /api/sync/attributes.php
 * Riceve attributi da MazGest e li salva nel database
 *
 * Body JSON: { "attributes": [...], "api_key": "xxx" }
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// GET: Stato sync attributi
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $pdo = getDbConnection();

    // Conta attributi
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM attributes");
    $attributeCount = $stmt->fetch()['count'];

    // Conta valori attributi
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM attribute_values");
    $valueCount = $stmt->fetch()['count'];

    // Ultimo sync
    $stmt = $pdo->query("SELECT * FROM sync_logs WHERE type = 'attributes' ORDER BY started_at DESC LIMIT 1");
    $lastSync = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'data' => [
            'attribute_count' => (int)$attributeCount,
            'value_count' => (int)$valueCount,
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
 * Genera slug da testo
 */
function generateAttributeSlug($text) {
    $slug = strtolower($text);
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

// POST: Sync attributi
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

    $attributes = $input['attributes'] ?? [];
    if (!is_array($attributes)) {
        jsonResponse(['success' => false, 'error' => 'Formato dati non valido'], 400);
    }

    $pdo = getDbConnection();
    $syncedAttributes = 0;
    $syncedValues = 0;
    $failed = 0;
    $errors = [];

    foreach ($attributes as $attr) {
        try {
            $pdo->beginTransaction();

            // Upsert attributo
            $stmt = $pdo->prepare("
                INSERT INTO attributes (
                    code, label, slug, description, filter_type, position, 
                    icon, show_in_menu, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    label = VALUES(label), 
                    filter_type = VALUES(filter_type), 
                    position = VALUES(position),
                    icon = VALUES(icon),
                    show_in_menu = VALUES(show_in_menu),
                    is_active = VALUES(is_active)
            ");
            
            $slug = generateAttributeSlug($attr['label']);
            $stmt->execute([
                $attr['code'],
                $attr['label'],
                $slug,
                $attr['description'] ?? null,
                $attr['filter_type'] ?? 'select',
                $attr['position'] ?? 0,
                $attr['icon'] ?? null,
                $attr['show_in_menu'] ?? 1,
                $attr['is_active'] ?? 1
            ]);

            // Ottieni ID attributo
            $attributeId = $pdo->lastInsertId();
            if (!$attributeId) {
                $stmt = $pdo->prepare("SELECT id FROM attributes WHERE code = ?");
                $stmt->execute([$attr['code']]);
                $result = $stmt->fetch();
                $attributeId = $result['id'];
            }

            $syncedAttributes++;

            // Rimuovi valori vecchi non presenti nei nuovi dati
            if (isset($attr['values']) && is_array($attr['values'])) {
                $newCodes = array_column($attr['values'], 'code');
                if (!empty($newCodes)) {
                    $placeholders = str_repeat('?,', count($newCodes) - 1) . '?';
                    $stmt = $pdo->prepare("DELETE FROM attribute_values WHERE attribute_id = ? AND code NOT IN ($placeholders)");
                    $stmt->execute(array_merge([$attributeId], $newCodes));
                }

                // Upsert valori attributo
                foreach ($attr['values'] as $value) {
                    $valueSlug = generateAttributeSlug($value['label']);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO attribute_values (
                            attribute_id, code, label, slug, description, 
                            min_value, max_value, color, sort_order, 
                            product_count, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            label = VALUES(label), 
                            product_count = VALUES(product_count),
                            min_value = VALUES(min_value),
                            max_value = VALUES(max_value),
                            color = VALUES(color),
                            sort_order = VALUES(sort_order),
                            is_active = VALUES(is_active)
                    ");
                    
                    $stmt->execute([
                        $attributeId,
                        $value['code'],
                        $value['label'],
                        $valueSlug,
                        $value['description'] ?? null,
                        $value['min_value'] ?? null,
                        $value['max_value'] ?? null,
                        $value['color'] ?? null,
                        $value['sort_order'] ?? 0,
                        $value['product_count'] ?? 0,
                        $value['is_active'] ?? 1
                    ]);
                    
                    $syncedValues++;
                }
            } else {
                // Se non ci sono valori, rimuovi tutti i valori esistenti per questo attributo
                $stmt = $pdo->prepare("DELETE FROM attribute_values WHERE attribute_id = ?");
                $stmt->execute([$attributeId]);
            }

            $pdo->commit();

        } catch (Exception $e) {
            $pdo->rollBack();
            $failed++;
            $errors[] = "Attributo {$attr['code']}: " . $e->getMessage();
        }
    }

    $durationMs = (int)((microtime(true) - $startTime) * 1000);

    // Log sync
    $logStmt = $pdo->prepare("
        INSERT INTO sync_logs (type, direction, status, items_total, items_processed, items_failed, error_message, completed_at, duration_ms)
        VALUES ('attributes', 'pull', ?, ?, ?, ?, ?, NOW(), ?)
    ");
    $status = $failed === 0 ? 'success' : ($failed < count($attributes) ? 'partial' : 'error');
    $logStmt->execute([
        $status,
        count($attributes),
        $syncedAttributes,
        $failed,
        count($errors) > 0 ? implode("\n", $errors) : null,
        $durationMs,
    ]);

    jsonResponse([
        'success' => $failed < count($attributes),
        'data' => [
            'total' => count($attributes),
            'attributes_synced' => $syncedAttributes,
            'values_synced' => $syncedValues,
            'failed' => $failed,
            'duration_ms' => $durationMs,
            'errors' => count($errors) > 0 ? $errors : null,
        ]
    ]);
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);