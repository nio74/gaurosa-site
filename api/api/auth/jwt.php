<?php
/**
 * JWT Helper per autenticazione
 */

require_once __DIR__ . '/../config.php';

// Cookie names (must match frontend expectations)
define('AUTH_COOKIE_NAME', 'gaurosa_auth');
define('REFRESH_COOKIE_NAME', 'gaurosa_refresh');

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Crea un JWT token
 */
function createJWT($payload, $expiry = null) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + ($expiry ?? JWT_EXPIRY);
    $payload = json_encode($payload);

    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode($payload);

    $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);

    return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
}

/**
 * Verifica un JWT token
 */
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    list($base64Header, $base64Payload, $base64Signature) = $parts;

    $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);
    $expectedSignature = base64UrlEncode($signature);

    if (!hash_equals($expectedSignature, $base64Signature)) return false;

    $payload = json_decode(base64UrlDecode($base64Payload), true);

    if (!$payload || $payload['exp'] < time()) return false;

    return $payload;
}

/**
 * Set authentication cookies
 */
function setAuthCookies($accessToken, $refreshToken = null) {
    $secure = !IS_LOCAL; // Use secure cookies in production
    $sameSite = 'Lax';

    // Access token cookie (15 minutes)
    setcookie(AUTH_COOKIE_NAME, $accessToken, [
        'expires' => time() + (15 * 60),
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => $sameSite
    ]);

    // Refresh token cookie (30 days)
    if ($refreshToken) {
        setcookie(REFRESH_COOKIE_NAME, $refreshToken, [
            'expires' => time() + (30 * 24 * 60 * 60),
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite
        ]);
    }
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies() {
    setcookie(AUTH_COOKIE_NAME, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true
    ]);
    setcookie(REFRESH_COOKIE_NAME, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true
    ]);
}

/**
 * Generate a random refresh token
 */
function generateRefreshToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Ottieni utente autenticato dal cookie o header
 */
function getAuthUser() {
    // First try cookie
    $token = $_COOKIE[AUTH_COOKIE_NAME] ?? null;

    // Fallback to Authorization header
    if (!$token) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }

    if (!$token) return null;

    return verifyJWT($token);
}

/**
 * Richiede autenticazione - ritorna errore se non autenticato
 */
function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Non autenticato'], 401);
    }
    return $user;
}
