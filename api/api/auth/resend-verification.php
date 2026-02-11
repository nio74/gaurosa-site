<?php
/**
 * API Reinvia Email Verifica - POST /api/auth/resend-verification.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/email.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$email = trim(strtolower($data['email'] ?? ''));

if (empty($email)) {
    jsonResponse(['success' => false, 'error' => 'Email obbligatoria'], 400);
}

try {
    $pdo = getDbConnection();

    // Cerca cliente
    $stmt = $pdo->prepare("SELECT id, first_name, email_verified FROM customers WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $customer = $stmt->fetch();

    if (!$customer) {
        // Non rivelare se l'email esiste o meno
        jsonResponse(['success' => true, 'message' => 'Se l\'email esiste, riceverai un nuovo link di verifica.']);
    }

    if ($customer['email_verified']) {
        jsonResponse(['success' => false, 'error' => 'Email già verificata'], 400);
    }

    // Genera nuovo token
    $verificationToken = bin2hex(random_bytes(32));
    $tokenExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Aggiorna token
    $stmt = $pdo->prepare("
        UPDATE customers
        SET verification_token = ?,
            token_expires_at = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$verificationToken, $tokenExpires, $customer['id']]);

    // Invia email
    $verificationUrl = SITE_URL . '/verifica-email/?token=' . $verificationToken;
    sendVerificationEmail($email, $customer['first_name'], $verificationUrl);

    jsonResponse([
        'success' => true,
        'message' => 'Se l\'email esiste, riceverai un nuovo link di verifica.'
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
