<?php
/**
 * Configurazione Database Gaurosa.it
 *
 * LOCALE: usa credenziali XAMPP
 * PRODUZIONE: cambiare con credenziali Hostinger
 */

// Rileva ambiente
$isLocal = ($_SERVER['HTTP_HOST'] ?? 'localhost') === 'localhost'
        || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;

if ($isLocal) {
    // SVILUPPO LOCALE (XAMPP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'gaurosasite');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // PRODUZIONE (HOSTINGER)
    define('DB_HOST', 'localhost'); // Su Hostinger di solito è localhost
    define('DB_NAME', 'u123456789_gaurosa'); // Cambiare con nome DB reale
    define('DB_USER', 'u123456789_admin');   // Cambiare con user reale
    define('DB_PASS', 'PASSWORD_SICURA');    // Cambiare con password reale
}

// API Key per autenticazione sync
define('SYNC_API_KEY', 'dev-api-key'); // Cambiare in produzione!

// Percorso uploads
define('UPLOADS_PATH', __DIR__ . '/uploads/');
define('UPLOADS_URL', '/api/uploads/');

/**
 * Connessione PDO al database
 */
function getDbConnection() {
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
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]));
    }
}

/**
 * Verifica API key
 */
function verifyApiKey() {
    $headers = getallheaders();
    $apiKey = $headers['X-Api-Key'] ?? $_POST['api_key'] ?? $_GET['api_key'] ?? null;

    if ($apiKey !== SYNC_API_KEY) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'API key non valida']));
    }
}

/**
 * Risposta JSON
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Genera slug da nome
 */
function generateSlug($name, $code) {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug . '-' . strtolower($code);
}
