<?php
/**
 * API Login - POST /api/auth/login.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();

// Validazione
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonResponse(['success' => false, 'error' => 'Email e password sono obbligatori'], 400);
}

try {
    $pdo = getDbConnection();

    // Cerca utente
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $customer = $stmt->fetch();

    if (!$customer) {
        jsonResponse(['success' => false, 'error' => 'Credenziali non valide'], 401);
    }

    // Verifica password
    if (!password_verify($password, $customer['password'])) {
        jsonResponse(['success' => false, 'error' => 'Credenziali non valide'], 401);
    }

    // Verifica email confermata
    if (!$customer['email_verified']) {
        jsonResponse([
            'success' => false,
            'error' => 'Email non verificata. Controlla la tua casella di posta.',
            'needsVerification' => true
        ], 401);
    }

    // Crea token JWT
    $accessToken = createJWT([
        'id' => $customer['id'],
        'email' => $customer['email'],
        'firstName' => $customer['first_name'],
        'lastName' => $customer['last_name']
    ]);

    // Genera refresh token
    $refreshToken = generateRefreshToken();

    // Imposta cookies httpOnly
    setAuthCookies($accessToken, $refreshToken);

    // Aggiorna ultimo login
    $stmt = $pdo->prepare("UPDATE customers SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?");
    $stmt->execute([$customer['id']]);

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $customer['id'],
            'email' => $customer['email'],
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'phone' => $customer['phone'],
            'emailVerified' => (bool)$customer['email_verified']
        ]
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
