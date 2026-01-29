<?php
/**
 * JWT Helper per autenticazione
 */

require_once __DIR__ . '/../config.php';

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Crea un JWT token
 */
function createJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
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
 * Ottieni utente autenticato dal token
 */
function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        return null;
    }

    return verifyJWT($matches[1]);
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
