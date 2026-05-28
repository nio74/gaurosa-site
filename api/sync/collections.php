<?php
/**
 * Endpoint sync collezioni da MazGest verso gaurosa-site
 *
 * POST /api/sync/collections.php
 * Body JSON:
 *   {
 *     "api_key": "<SYNC_API_KEY>",
 *     "collections": [
 *       { "mazgest_id": 1, "name": "Fantasy", "slug": "fantasy", "description": "...", "is_active": true, "position": 0 },
 *       ...
 *     ]
 *   }
 *
 * Upsert idempotente per mazgest_id (chiave unica aggiunta alla tabella collections).
 * Pattern speculare a products.php.
 */

require_once __DIR__ . '/../config.php';

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

$startTime = microtime(true);

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
}

// Auth via SYNC_API_KEY (uguale a sync prodotti)
$apiKey = $input['api_key'] ?? ($_SERVER['HTTP_X_API_KEY'] ?? null);
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

$collections = $input['collections'] ?? [];
if (!is_array($collections)) {
    jsonResponse(['success' => false, 'error' => 'Formato dati non valido (collections deve essere array)'], 400);
}

$pdo = getDbConnection();
$processed = 0;
$inserted = 0;
$updated = 0;
$failed = 0;
$errors = [];

foreach ($collections as $coll) {
    try {
        $mazgestId = isset($coll['mazgest_id']) ? (int)$coll['mazgest_id'] : null;
        if (!$mazgestId) {
            throw new Exception("mazgest_id mancante nella collezione: " . json_encode($coll));
        }

        $name = trim($coll['name'] ?? '');
        if ($name === '') {
            throw new Exception("Nome collezione mancante per mazgest_id={$mazgestId}");
        }

        // Slug: fornito da MazGest oppure derivato dal name
        $slug = $coll['slug'] ?? null;
        if (!$slug) {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
            $slug = trim($slug, '-');
        }

        $description = $coll['description'] ?? null;
        $isActive = isset($coll['is_active']) ? (int)(bool)$coll['is_active'] : 1;
        $position = isset($coll['position']) ? (int)$coll['position'] : 0;

        // Cerca per mazgest_id (idempotente)
        $stmt = $pdo->prepare("SELECT id FROM collections WHERE mazgest_id = :mid LIMIT 1");
        $stmt->execute(['mid' => $mazgestId]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Update
            $upd = $pdo->prepare("
                UPDATE collections
                SET name = :name, slug = :slug, description = :description,
                    is_active = :is_active, position = :position,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $upd->execute([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'is_active' => $isActive,
                'position' => $position,
                'id' => $existing['id'],
            ]);
            $updated++;
        } else {
            // Insert (cura il caso di slug gia' esistente da inserimento manuale precedente:
            // se collision, agganciamo mazgest_id al record esistente con quello slug)
            $stmtSlug = $pdo->prepare("SELECT id FROM collections WHERE slug = :slug LIMIT 1");
            $stmtSlug->execute(['slug' => $slug]);
            $bySlug = $stmtSlug->fetch();

            if ($bySlug) {
                // Aggancia mazgest_id al record esistente e aggiorna
                $upd = $pdo->prepare("
                    UPDATE collections
                    SET mazgest_id = :mid, name = :name, description = :description,
                        is_active = :is_active, position = :position,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $upd->execute([
                    'mid' => $mazgestId,
                    'name' => $name,
                    'description' => $description,
                    'is_active' => $isActive,
                    'position' => $position,
                    'id' => $bySlug['id'],
                ]);
                $updated++;
            } else {
                $ins = $pdo->prepare("
                    INSERT INTO collections (mazgest_id, name, slug, description, is_active, position, created_at, updated_at)
                    VALUES (:mid, :name, :slug, :description, :is_active, :position, NOW(), NOW())
                ");
                $ins->execute([
                    'mid' => $mazgestId,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $description,
                    'is_active' => $isActive,
                    'position' => $position,
                ]);
                $inserted++;
            }
        }
        $processed++;
    } catch (Exception $e) {
        $failed++;
        $errors[] = [
            'mazgest_id' => $coll['mazgest_id'] ?? null,
            'name' => $coll['name'] ?? null,
            'error' => $e->getMessage(),
        ];
        error_log("[SyncCollections] Errore: " . $e->getMessage());
    }
}

// Log sintetico (riusa tabella ecommerce_sync_log se esiste, ignora altrimenti)
$elapsedMs = (int)((microtime(true) - $startTime) * 1000);
error_log("[SyncCollections] Completato in {$elapsedMs}ms: processed={$processed}, inserted={$inserted}, updated={$updated}, failed={$failed}");

jsonResponse([
    'success' => true,
    'data' => [
        'processed' => $processed,
        'inserted' => $inserted,
        'updated' => $updated,
        'failed' => $failed,
        'errors' => $errors,
        'elapsed_ms' => $elapsedMs,
    ],
]);
