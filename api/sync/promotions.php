<?php
/**
 * API Sync Promozioni
 *
 * POST /api/sync/promotions.php
 * Riceve promozioni da MazGest e le salva nel database gaurosa.it
 *
 * Body JSON: { "promotions": [...] }
 * Header: x-api-key: <SYNC_API_KEY>
 */

require_once __DIR__ . '/../config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, x-api-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Autenticazione API Key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'Unauthorized'], 401);
}

$pdo = getDbConnection();

// Crea tabella promotions se non esiste
$pdo->exec("
    CREATE TABLE IF NOT EXISTS promotions (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('percentage','fixed_amount','bundle_2_1','cart_threshold','flash_sale','coupon') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount_type ENUM('percentage','fixed_amount') NOT NULL DEFAULT 'percentage',
        applies_to ENUM('all_products','category','tag','specific_products') NOT NULL DEFAULT 'all_products',
        category_slug VARCHAR(100),
        tag_slug VARCHAR(100),
        product_codes TEXT,
        bundle_free_percent DECIMAL(5,2),
        cart_min_amount DECIMAL(10,2),
        coupon_code VARCHAR(50) UNIQUE,
        max_uses INT,
        max_uses_per_user INT DEFAULT 1,
        times_used INT DEFAULT 0,
        starts_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL,
        show_countdown TINYINT(1) DEFAULT 0,
        promo_badge VARCHAR(50),
        promo_message VARCHAR(255),
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active_dates (is_active, starts_at, ends_at),
        INDEX idx_type (type),
        INDEX idx_coupon (coupon_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// GET: Lista promozioni attive
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
        SELECT * FROM promotions
        WHERE is_active = 1 AND starts_at <= ? AND ends_at >= ?
        ORDER BY created_at DESC
    ");
    $stmt->execute([$now, $now]);
    $promotions = $stmt->fetchAll();

    // Decodifica product_codes JSON
    foreach ($promotions as &$p) {
        $p['product_codes'] = $p['product_codes'] ? json_decode($p['product_codes'], true) : [];
        $p['discount_value'] = (float)$p['discount_value'];
        $p['bundle_free_percent'] = $p['bundle_free_percent'] ? (float)$p['bundle_free_percent'] : null;
        $p['cart_min_amount'] = $p['cart_min_amount'] ? (float)$p['cart_min_amount'] : null;
        $p['show_countdown'] = (bool)$p['show_countdown'];
        $p['is_active'] = (bool)$p['is_active'];
    }

    jsonResponse(['success' => true, 'data' => $promotions]);
}

// POST: Ricevi e salva promozioni da MazGest
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    $promotions = $body['promotions'] ?? [];

    if (empty($promotions)) {
        jsonResponse(['success' => false, 'error' => 'Nessuna promozione ricevuta'], 400);
    }

    // Delete promotions that no longer exist in MazGest
    // active_ids = list of IDs currently in MazGest; anything else gets removed
    $activeIds = $body['active_ids'] ?? null;
    if (is_array($activeIds) && count($activeIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($activeIds), '?'));
        $deleteStmt = $pdo->prepare("DELETE FROM promotions WHERE id NOT IN ($placeholders)");
        $deleteStmt->execute(array_values($activeIds));
        $deleted = $deleteStmt->rowCount();
        if ($deleted > 0) {
            error_log("[PromotionsSync] Deleted $deleted stale promotions not in active_ids");
        }
    } elseif (is_array($activeIds) && count($activeIds) === 0) {
        // No promotions in MazGest at all — delete everything
        $pdo->exec("DELETE FROM promotions");
        error_log("[PromotionsSync] Deleted all promotions (active_ids is empty)");
    }
    // If active_ids not sent (old client), skip deletion for backwards compatibility

    $synced = 0;
    $errors = [];

    foreach ($promotions as $p) {
        try {
            $id = (int)($p['id'] ?? 0);
            if (!$id) {
                $errors[] = "Promozione senza ID saltata";
                continue;
            }

            // Prepara product_codes come JSON
            $productCodes = null;
            if (!empty($p['product_codes']) && is_array($p['product_codes'])) {
                $productCodes = json_encode($p['product_codes']);
            }

            // Converti date ISO → MySQL datetime
            $startsAt = date('Y-m-d H:i:s', strtotime($p['starts_at']));
            $endsAt   = date('Y-m-d H:i:s', strtotime($p['ends_at']));

            // UPSERT: inserisci o aggiorna
            $stmt = $pdo->prepare("
                INSERT INTO promotions (
                    id, name, description, type, discount_value, discount_type,
                    applies_to, category_slug, tag_slug, product_codes,
                    bundle_free_percent, cart_min_amount,
                    coupon_code, max_uses, max_uses_per_user,
                    starts_at, ends_at, show_countdown,
                    promo_badge, promo_message, is_active
                ) VALUES (
                    :id, :name, :description, :type, :discount_value, :discount_type,
                    :applies_to, :category_slug, :tag_slug, :product_codes,
                    :bundle_free_percent, :cart_min_amount,
                    :coupon_code, :max_uses, :max_uses_per_user,
                    :starts_at, :ends_at, :show_countdown,
                    :promo_badge, :promo_message, :is_active
                )
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    description = VALUES(description),
                    type = VALUES(type),
                    discount_value = VALUES(discount_value),
                    discount_type = VALUES(discount_type),
                    applies_to = VALUES(applies_to),
                    category_slug = VALUES(category_slug),
                    tag_slug = VALUES(tag_slug),
                    product_codes = VALUES(product_codes),
                    bundle_free_percent = VALUES(bundle_free_percent),
                    cart_min_amount = VALUES(cart_min_amount),
                    coupon_code = VALUES(coupon_code),
                    max_uses = VALUES(max_uses),
                    max_uses_per_user = VALUES(max_uses_per_user),
                    starts_at = VALUES(starts_at),
                    ends_at = VALUES(ends_at),
                    show_countdown = VALUES(show_countdown),
                    promo_badge = VALUES(promo_badge),
                    promo_message = VALUES(promo_message),
                    is_active = VALUES(is_active),
                    updated_at = CURRENT_TIMESTAMP
            ");

            $stmt->execute([
                ':id'                  => $id,
                ':name'                => $p['name'] ?? '',
                ':description'         => $p['description'] ?? null,
                ':type'                => $p['type'] ?? 'percentage',
                ':discount_value'      => (float)($p['discount_value'] ?? 0),
                ':discount_type'       => $p['discount_type'] ?? 'percentage',
                ':applies_to'          => $p['applies_to'] ?? 'all_products',
                ':category_slug'       => $p['category_slug'] ?? null,
                ':tag_slug'            => $p['tag_slug'] ?? null,
                ':product_codes'       => $productCodes,
                ':bundle_free_percent' => isset($p['bundle_free_percent']) ? (float)$p['bundle_free_percent'] : null,
                ':cart_min_amount'     => isset($p['cart_min_amount']) ? (float)$p['cart_min_amount'] : null,
                ':coupon_code'         => $p['coupon_code'] ?? null,
                ':max_uses'            => isset($p['max_uses']) ? (int)$p['max_uses'] : null,
                ':max_uses_per_user'   => (int)($p['max_uses_per_user'] ?? 1),
                ':starts_at'           => $startsAt,
                ':ends_at'             => $endsAt,
                ':show_countdown'      => (int)($p['show_countdown'] ?? 0),
                ':promo_badge'         => $p['promo_badge'] ?? null,
                ':promo_message'       => $p['promo_message'] ?? null,
                ':is_active'           => (int)($p['is_active'] ?? 1),
            ]);

            $synced++;
        } catch (Exception $e) {
            $errors[] = "Promozione #{$p['id']}: " . $e->getMessage();
        }
    }

    jsonResponse([
        'success' => true,
        'synced'  => $synced,
        'errors'  => $errors,
        'message' => "Sincronizzate {$synced} promozioni",
    ]);
}

jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
