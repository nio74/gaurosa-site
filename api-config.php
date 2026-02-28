<?php
/**
 * Configurazione Database Gaurosa.it
 */

// Rileva ambiente
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocal = $host === 'localhost' 
        || strpos($host, 'localhost') !== false
        || $host === '127.0.0.1'
        || strpos($host, '127.0.0.1') !== false;
define('IS_LOCAL', $isLocal);

if ($isLocal) {
    // SVILUPPO LOCALE (XAMPP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'gaurosasite');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // PRODUZIONE (HOSTINGER)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u341208956_gaurosasito');
    define('DB_USER', 'u341208956_paolo');
    define('DB_PASS', '6#KvGR!d');
}

// JWT Secret
define('JWT_SECRET', '191c7f0a8982de8ce7a84b0cfea54481a9f33d1b4ac8ddcc516a7fef0993d5e1');
define('JWT_EXPIRY', 3600 * 24 * 7); // 7 giorni

// MazGest API
define('MAZGEST_API_URL', 'https://api.mazgest.org');
define('MAZGEST_API_KEY', '431e0743e76469961f4be3ce724dba991c3f5f3f63aebd6e3ab6fa264062de84');

// Sync API Key (usata per sincronizzazione prodotti da MazGest)
define('SYNC_API_KEY', 'gaurosa_prod_2026_secure_key_change_me');

// Email SMTP
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'noreplay@gaurosa.it');
define('SMTP_PASS', 'o8rbeNH8[');
define('EMAIL_FROM', 'noreplay@gaurosa.it');
define('EMAIL_FROM_NAME', 'Gaurosa Gioielli');

// Site URL
define('SITE_URL', $isLocal ? 'http://localhost:3003' : 'https://gaurosa.it');

/**
 * Connessione PDO al database
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'error' => 'Database connection failed'], 500);
        }
    }
    return $pdo;
}

/**
 * Risposta JSON con CORS
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');

    // CORS - Allow specific origins for credentials
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'https://gaurosa.it',
        'https://www.gaurosa.it',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3003'
    ];

    if (in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: https://gaurosa.it');
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit;
    }

    echo json_encode($data);
    exit;
}

/**
 * Ottieni body JSON della richiesta
 */
function getJsonBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

/**
 * Calcola il prezzo scontato applicando le promozioni attive.
 *
 * Restituisce un array con:
 *   - price            float  Prezzo finale (scontato se promo applicata)
 *   - compare_at_price float|null  Prezzo originale (se promo applicata), null altrimenti
 *   - promo_badge      string|null Badge testuale (es: "-20%")
 *
 * Logica priorità:
 *   1. specific_products  (codice prodotto nella lista)
 *   2. category           (main_category o subcategory del prodotto)
 *   3. tag                (tag del prodotto)
 *   4. all_products       (si applica a tutto)
 *
 * @param PDO    $pdo          Connessione DB
 * @param float  $basePrice    Prezzo base del prodotto
 * @param string $productCode  Codice prodotto (es: M02863)
 * @param string $mainCategory Categoria principale (es: gioielli)
 * @param string $subcategory  Sottocategoria (es: anello)
 * @param array  $productTags  Array di tag code del prodotto
 * @param float|null $existingCompareAt  compare_at_price già presente nel DB prodotto
 */
function applyPromotions(
    PDO $pdo,
    float $basePrice,
    string $productCode,
    string $mainCategory = '',
    string $subcategory = '',
    array $productTags = [],
    ?float $existingCompareAt = null
): array {
    $now = date('Y-m-d H:i:s');

    // Fetch all active promotions (percentage or fixed_amount only — no coupon/bundle/threshold here)
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM promotions
            WHERE is_active = 1
              AND starts_at <= :now
              AND ends_at   >= :now
              AND type IN ('percentage', 'fixed_amount', 'flash_sale')
            ORDER BY
              CASE applies_to
                WHEN 'specific_products' THEN 1
                WHEN 'category'          THEN 2
                WHEN 'tag'               THEN 3
                WHEN 'all_products'      THEN 4
                ELSE 5
              END ASC,
              discount_value DESC
        ");
        $stmt->execute([':now' => $now]);
        $promotions = $stmt->fetchAll();
    } catch (Exception $e) {
        // If promotions table doesn't exist yet, return unchanged
        return [
            'price'            => $basePrice,
            'compare_at_price' => $existingCompareAt,
            'promo_badge'      => null,
        ];
    }

    foreach ($promotions as $promo) {
        $applies = false;

        switch ($promo['applies_to']) {
            case 'specific_products':
                $codes = $promo['product_codes'] ? json_decode($promo['product_codes'], true) : [];
                $applies = is_array($codes) && in_array($productCode, $codes);
                break;

            case 'category':
                $slug = $promo['category_slug'] ?? '';
                $applies = ($slug === $mainCategory || $slug === $subcategory);
                break;

            case 'tag':
                $tagSlug = $promo['tag_slug'] ?? '';
                $applies = in_array($tagSlug, $productTags);
                break;

            case 'all_products':
                $applies = true;
                break;
        }

        if (!$applies) continue;

        // Calculate discounted price
        $discountValue = (float)$promo['discount_value'];
        $discountedPrice = $basePrice;

        if ($promo['discount_type'] === 'percentage') {
            $discountedPrice = round($basePrice * (1 - $discountValue / 100), 2);
        } elseif ($promo['discount_type'] === 'fixed_amount') {
            $discountedPrice = max(0, round($basePrice - $discountValue, 2));
        }

        if ($discountedPrice >= $basePrice) continue; // No actual discount

        // Build badge label
        $badge = $promo['promo_badge'] ?: null;
        if (!$badge) {
            if ($promo['discount_type'] === 'percentage') {
                $badge = '-' . (int)$discountValue . '%';
            } else {
                $badge = '-€' . number_format($discountValue, 0);
            }
        }

        return [
            'price'            => $discountedPrice,
            'compare_at_price' => $basePrice,
            'promo_badge'      => $badge,
        ];
    }

    // No promotion matched
    return [
        'price'            => $basePrice,
        'compare_at_price' => $existingCompareAt,
        'promo_badge'      => null,
    ];
}
