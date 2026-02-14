<?php
/**
 * Configurazione Database Gaurosa.it
 */

// Load secrets from external file (gitignored)
$secretsPath = __DIR__ . '/secrets.php';
if (!file_exists($secretsPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration missing. Copy secrets.example.php to secrets.php']);
    exit;
}
$secrets = require $secretsPath;

// Rileva ambiente
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocal = $host === 'localhost' 
        || strpos($host, 'localhost') !== false
        || $host === '127.0.0.1'
        || strpos($host, '127.0.0.1') !== false;
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

// Email SMTP
define('SMTP_HOST', $secrets['smtp']['host']);
define('SMTP_PORT', $secrets['smtp']['port']);
define('SMTP_USER', $secrets['smtp']['user']);
define('SMTP_PASS', $secrets['smtp']['pass']);
define('EMAIL_FROM', 'noreplay@gaurosa.it');
define('EMAIL_FROM_NAME', 'Gaurosa Gioielli');

// Site URL
define('SITE_URL', $isLocal ? 'http://localhost:3003' : 'https://gaurosa.it');

// OAuth - Google Sign-In
define('GOOGLE_CLIENT_ID', $secrets['google_client_id']);
define('GOOGLE_CLIENT_SECRET', $secrets['google_client_secret']);

// Stripe
define('STRIPE_SECRET_KEY', $isLocal ? $secrets['stripe_secret_key_test'] : $secrets['stripe_secret_key_live']);
define('STRIPE_WEBHOOK_SECRET', $isLocal ? $secrets['stripe_webhook_secret_test'] : $secrets['stripe_webhook_secret_live']);

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
