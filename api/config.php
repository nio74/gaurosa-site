<?php
/**
 * Configurazione Database Gaurosa.it
 */

// Helper ambiente (legge .env nella root)
require_once __DIR__ . '/lib/env.php';

// Load secrets from external file (gitignored)
$secretsPath = __DIR__ . '/secrets.php';
if (!file_exists($secretsPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration missing. Copy secrets.example.php to secrets.php']);
    exit;
}
$secrets = require $secretsPath;

// Rileva ambiente (preferisce flag GAUROSA_ENV in .env, fallback su sniffing host)
$isLocal = gaurosaIsLocal();
define('IS_LOCAL', $isLocal);

if ($isLocal) {
    // SVILUPPO LOCALE (XAMPP)
    define('DB_HOST', $secrets['db_local']['host']);
    define('DB_NAME', $secrets['db_local']['name']);
    define('DB_USER', $secrets['db_local']['user']);
    define('DB_PASS', $secrets['db_local']['pass']);
} else {
    // PRODUZIONE (HOSTINGER)
    define('DB_HOST', $secrets['db_production']['host']);
    define('DB_NAME', $secrets['db_production']['name']);
    define('DB_USER', $secrets['db_production']['user']);
    define('DB_PASS', $secrets['db_production']['pass']);
}

// JWT Secret
define('JWT_SECRET', $secrets['jwt_secret']);
define('JWT_EXPIRY', 3600 * 24 * 7); // 7 giorni

// MazGest API
define('MAZGEST_API_URL', $isLocal ? 'http://localhost:5000' : 'https://api.mazgest.org');
define('MAZGEST_API_KEY', $secrets['mazgest_api_key']);

// Sync API Key (usata per sincronizzazione prodotti da MazGest)
define('SYNC_API_KEY', $secrets['sync_api_key']);

// Email SMTP — .env ha precedenza (in dev: Mailpit localhost:1025). Fallback su secrets.php (prod: Hostinger SMTP).
define('SMTP_HOST',   gaurosaEnvVar('SMTP_HOST',   $secrets['smtp']['host'] ?? 'localhost'));
define('SMTP_PORT',   (int) gaurosaEnvVar('SMTP_PORT', $secrets['smtp']['port'] ?? 1025));
define('SMTP_SECURE', gaurosaEnvVar('SMTP_SECURE', 'true')); // 'true'/'false' string
define('SMTP_USER',   gaurosaEnvVar('SMTP_USER',   $secrets['smtp']['user'] ?? ''));
define('SMTP_PASS',   gaurosaEnvVar('SMTP_PASS',   $secrets['smtp']['pass'] ?? ''));
define('EMAIL_FROM',      gaurosaEnvVar('EMAIL_FROM',      'noreplay@gaurosa.it'));
define('EMAIL_FROM_NAME', gaurosaEnvVar('EMAIL_FROM_NAME', 'Gaurosa Gioielli'));

// Site URL
define('SITE_URL', $isLocal ? 'http://localhost:3003' : 'https://gaurosa.it');

// OAuth - Google Sign-In
define('GOOGLE_CLIENT_ID', $secrets['google_client_id']);
define('GOOGLE_CLIENT_SECRET', $secrets['google_client_secret']);

// Stripe
define('STRIPE_SECRET_KEY', $isLocal ? $secrets['stripe_secret_key_test'] : $secrets['stripe_secret_key_live']);
define('STRIPE_WEBHOOK_SECRET', $isLocal ? $secrets['stripe_webhook_secret_test'] : $secrets['stripe_webhook_secret_live']);

// PayPal
define('PAYPAL_CLIENT_ID', $isLocal ? $secrets['paypal_client_id_sandbox'] : $secrets['paypal_client_id_live']);
define('PAYPAL_SECRET', $isLocal ? $secrets['paypal_secret_sandbox'] : $secrets['paypal_secret_live']);
define('PAYPAL_API_URL', $isLocal ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');

// Bonifico Bancario
define('BANK_ACCOUNT_HOLDER', 'MAZZON GIOIELLI S.N.C. DI MAZZON IURIC & C.');
define('BANK_IBAN', 'IT90Z0832763100000000800479');
define('BANK_NAME', 'Banca di Credito Cooperativo di Roma');
define('BANK_BRANCH', 'AG. 204');
define('BANK_SWIFT', 'ICRAITRRROM');

// Spedizione
define('FREE_SHIPPING_THRESHOLD', 45);  // EUR - spedizione gratuita sopra questa soglia
define('SHIPPING_COST', 5.90);          // EUR - costo spedizione standard

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
