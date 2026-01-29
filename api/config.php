<?php
/**
 * Configurazione Database Gaurosa.it
 */

// Rileva ambiente
$isLocal = ($_SERVER['HTTP_HOST'] ?? 'localhost') === 'localhost'
        || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
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

// Email SMTP
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'noreplay@gaurosa.it');
define('SMTP_PASS', 'o8rbeNH8[');
define('EMAIL_FROM', 'noreplay@gaurosa.it');
define('EMAIL_FROM_NAME', 'Gaurosa Gioielli');

// Site URL
define('SITE_URL', $isLocal ? 'http://localhost:3001' : 'https://gaurosa.it');

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
        'http://localhost:3001'
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
