<?php
/**
 * API Registrazione - POST /api/auth/register.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/email.php';
require_once __DIR__ . '/../lib/mazgest-sync.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();

// Validazione
$email = trim(strtolower($data['email'] ?? ''));
$password = $data['password'] ?? '';
$firstName = trim($data['firstName'] ?? '');
$lastName = trim($data['lastName'] ?? '');
$phone = trim($data['phone'] ?? '');
$privacyConsent = $data['privacyConsent'] ?? false;
$marketingConsent = $data['marketingConsent'] ?? false;

// Validazioni
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Email non valida'], 400);
}

if (strlen($password) < 8) {
    jsonResponse(['success' => false, 'error' => 'La password deve essere di almeno 8 caratteri'], 400);
}

if (empty($firstName) || empty($lastName)) {
    jsonResponse(['success' => false, 'error' => 'Nome e cognome sono obbligatori'], 400);
}

// Privacy consent è obbligatorio per legge (GDPR)
if (!$privacyConsent) {
    jsonResponse(['success' => false, 'error' => 'Devi accettare la Privacy Policy per registrarti'], 400);
}

try {
    $pdo = getDbConnection();

    // Verifica email esistente
    $stmt = $pdo->prepare("SELECT id FROM customers WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Email già registrata'], 409);
    }

    // Genera token verifica
    $verificationToken = bin2hex(random_bytes(32));
    $tokenExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Inserisci cliente
    $stmt = $pdo->prepare("
        INSERT INTO customers (
            email, password, first_name, last_name, phone,
            auth_provider,
            email_verified, verification_token, token_expires_at,
            privacy_consent, privacy_consent_at,
            marketing_consent, consented_at, from_website,
            created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            'email',
            0, ?, ?,
            1, NOW(),
            ?, ?, 1,
            NOW(), NOW()
        )
    ");

    $stmt->execute([
        $email,
        $hashedPassword,
        $firstName,
        $lastName,
        $phone,
        $verificationToken,
        $tokenExpires,
        $marketingConsent ? 1 : 0,
        $marketingConsent ? date('Y-m-d H:i:s') : null
    ]);

    $customerId = $pdo->lastInsertId();

    // Sincronizza subito con MazGest (in tutti gli ambienti)
    $syncResult = syncCustomerToMazGest($customerId);
    error_log("[Register] MazGest sync for customer $customerId: " . ($syncResult ? 'OK' : 'FAILED'));

    if (IS_LOCAL) {
        // SVILUPPO LOCALE: auto-verifica email (no bisogno di cliccare link)
        $stmt = $pdo->prepare("
            UPDATE customers
            SET email_verified = 1,
                email_verified_at = NOW(),
                verification_token = NULL,
                token_expires_at = NULL,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$customerId]);

        jsonResponse([
            'success' => true,
            'message' => 'Registrazione completata! (Dev: email auto-verificata)',
            'customerId' => $customerId,
            'emailSent' => false,
            'autoVerified' => true,
            'mazgestSync' => $syncResult
        ], 201);
    } else {
        // PRODUZIONE: invia email di verifica normalmente
        $verificationUrl = SITE_URL . '/verifica-email/?token=' . $verificationToken;
        $emailSent = sendVerificationEmail($email, $firstName, $verificationUrl);

        jsonResponse([
            'success' => true,
            'message' => 'Registrazione completata! Controlla la tua email per verificare l\'account.',
            'customerId' => $customerId,
            'emailSent' => $emailSent,
            'mazgestSync' => $syncResult
        ], 201);
    }

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore durante la registrazione: ' . $e->getMessage()], 500);
}
