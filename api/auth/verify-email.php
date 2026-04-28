<?php
/**
 * API Verifica Email - POST /api/auth/verify-email.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/mazgest-sync.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$token = trim($data['token'] ?? '');

if (empty($token)) {
    jsonResponse(['success' => false, 'error' => 'Token mancante'], 400);
}

try {
    $pdo = getDbConnection();

    // Cerca cliente con questo token
    $stmt = $pdo->prepare("
        SELECT id, email, first_name, email_verified, token_expires_at
        FROM customers
        WHERE verification_token = ?
        LIMIT 1
    ");
    $stmt->execute([$token]);
    $customer = $stmt->fetch();

    if (!$customer) {
        jsonResponse(['success' => false, 'error' => 'Token non valido'], 400);
    }

    // Verifica se già verificato
    if ($customer['email_verified']) {
        jsonResponse([
            'success' => true,
            'alreadyVerified' => true,
            'message' => 'Email già verificata'
        ]);
    }

    // Verifica scadenza token
    if (strtotime($customer['token_expires_at']) < time()) {
        jsonResponse(['success' => false, 'error' => 'Token scaduto. Richiedi un nuovo link di verifica.'], 400);
    }

    // Aggiorna cliente come verificato
    $stmt = $pdo->prepare("
        UPDATE customers
        SET email_verified = 1,
            email_verified_at = NOW(),
            verification_token = NULL,
            token_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$customer['id']]);

    // Sincronizza con MazGest (se non già sincronizzato dalla registrazione)
    syncCustomerToMazGest($customer['id']);

    jsonResponse([
        'success' => true,
        'message' => 'Email verificata con successo!'
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
