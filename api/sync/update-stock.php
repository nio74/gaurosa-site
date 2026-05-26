<?php
/**
 * API Sync - POST /api/sync/update-stock.php
 *
 * Chiamato da MazGest dopo qualsiasi modifica stock di un prodotto sincronizzato:
 * - ricezione ordine dal sito + decremento
 * - vendita POS in negozio
 * - reso (incremento)
 * - rettifica manuale
 *
 * Permette al sito di rispecchiare lo stock reale di MazGest senza dover cliccare
 * "Sincronizza prodotti" dalla UI.
 *
 * Body (JSON):
 * {
 *   "productCode": "M00115",
 *   "stock": 3,
 *   "variants": [                                  // opzionale
 *     {"sku": "M00115-14", "stock": 2},
 *     {"sku": "M00115-16", "stock": 1}
 *   ]
 * }
 *
 * Auth: header `x-api-key` con SYNC_API_KEY o MAZGEST_API_KEY (stesso pattern
 * usato da update-order-status.php).
 *
 * Response:
 * - 200 success=true se prodotto aggiornato (anche se non sincronizzato — si logga e si ignora)
 * - 401 API key mancante/invalida
 * - 400 body malformato
 * - 500 errore DB
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Auth
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== SYNC_API_KEY && $apiKey !== MAZGEST_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

$data = getJsonBody();
$productCode = $data['productCode'] ?? null;
$productStock = $data['stock'] ?? null;
$variants = $data['variants'] ?? [];

if (!$productCode || $productStock === null) {
    jsonResponse(['success' => false, 'error' => 'productCode e stock richiesti'], 400);
}

$productStock = max(0, (int)$productStock);

try {
    $pdo = getDbConnection();

    // Trova prodotto per codice
    $stmt = $pdo->prepare("SELECT id, code, stock FROM products WHERE code = :code LIMIT 1");
    $stmt->execute(['code' => $productCode]);
    $product = $stmt->fetch();

    if (!$product) {
        // Prodotto non sincronizzato sul sito — non è un errore, capita per vendite
        // POS di prodotti che il merchant non vende online. Logga e ritorna OK.
        error_log("[SyncStock] Prodotto {$productCode} non presente sul sito — skip");
        jsonResponse([
            'success' => true,
            'data' => ['updated' => false, 'reason' => 'product_not_synced'],
        ]);
    }

    $pdo->beginTransaction();

    try {
        $updateStmt = $pdo->prepare("
            UPDATE products SET stock = :stock, updated_at = NOW(3) WHERE id = :id
        ");
        $updateStmt->execute(['stock' => $productStock, 'id' => (int)$product['id']]);

        $variantsUpdated = 0;
        $variantsSkipped = [];

        if (is_array($variants) && !empty($variants)) {
            $variantStmt = $pdo->prepare("
                UPDATE product_variants SET stock = :stock
                WHERE product_id = :product_id AND sku = :sku
            ");
            foreach ($variants as $v) {
                $sku = $v['sku'] ?? null;
                $vStock = isset($v['stock']) ? max(0, (int)$v['stock']) : null;
                if (!$sku || $vStock === null) {
                    $variantsSkipped[] = $sku ?: '(missing sku)';
                    continue;
                }
                $variantStmt->execute([
                    'stock' => $vStock,
                    'product_id' => (int)$product['id'],
                    'sku' => $sku,
                ]);
                if ($variantStmt->rowCount() > 0) {
                    $variantsUpdated++;
                } else {
                    $variantsSkipped[] = $sku;
                }
            }
        }

        $pdo->commit();

        $logLine = "[SyncStock] Prodotto {$productCode}: stock {$product['stock']}→{$productStock}";
        if ($variantsUpdated > 0 || !empty($variantsSkipped)) {
            $logLine .= ", varianti aggiornate={$variantsUpdated}";
            if (!empty($variantsSkipped)) {
                $logLine .= ", saltate=[" . implode(',', $variantsSkipped) . "]";
            }
        }
        error_log($logLine);

        jsonResponse([
            'success' => true,
            'data' => [
                'updated' => true,
                'product_code' => $productCode,
                'previous_stock' => (int)$product['stock'],
                'new_stock' => $productStock,
                'variants_updated' => $variantsUpdated,
                'variants_skipped' => $variantsSkipped,
            ],
        ]);

    } catch (Exception $txErr) {
        $pdo->rollBack();
        throw $txErr;
    }

} catch (Exception $e) {
    error_log('[SyncStock] Errore: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore aggiornamento stock',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}
