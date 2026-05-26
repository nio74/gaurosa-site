<?php
/**
 * API Reset/Imposta password - POST /api/auth/reset-password.php
 *
 * Body JSON: { "token": "abc123...", "password": "NuovaPwd!" }
 *
 * Valida token e aggiorna password del customer.
 * Funziona sia per "imposta password" (guest customer) che "reimposta password" (utente esistente).
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$token = trim($data['token'] ?? '');
$password = $data['password'] ?? '';

if (empty($token)) {
    jsonResponse(['success' => false, 'error' => 'Token mancante'], 400);
}

if (empty($password) || strlen($password) < 8) {
    jsonResponse(['success' => false, 'error' => 'La password deve essere di almeno 8 caratteri'], 400);
}

try {
    $pdo = getDbConnection();

    // Cerca token valido (non usato, non scaduto)
    $stmt = $pdo->prepare("
        SELECT pr.id AS reset_id, pr.customer_id, pr.expires_at, pr.used_at,
               c.email, c.password AS current_password
        FROM password_resets pr
        JOIN customers c ON c.id = pr.customer_id
        WHERE pr.token = :token
        LIMIT 1
    ");
    $stmt->execute(['token' => $token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        jsonResponse(['success' => false, 'error' => 'Link non valido o non più attivo'], 400);
    }

    if ($reset['used_at'] !== null) {
        jsonResponse(['success' => false, 'error' => 'Questo link è già stato utilizzato. Richiedine uno nuovo.'], 400);
    }

    if (strtotime($reset['expires_at']) < time()) {
        jsonResponse(['success' => false, 'error' => 'Il link è scaduto. Richiedi un nuovo link via "Password dimenticata".'], 400);
    }

    // Era prima volta o reset?
    $isFirstTime = empty($reset['current_password']);

    $pdo->beginTransaction();

    try {
        // Hash password (bcrypt)
        $hashed = password_hash($password, PASSWORD_BCRYPT);

        // Aggiorna password del customer
        $stmt = $pdo->prepare("
            UPDATE customers
            SET password = :pwd,
                email_verified = 1,
                email_verified_at = COALESCE(email_verified_at, NOW(3)),
                updated_at = NOW(3)
            WHERE id = :cid
        ");
        $stmt->execute([
            'pwd' => $hashed,
            'cid' => $reset['customer_id'],
        ]);

        // Marca token come usato
        $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW(3) WHERE id = :id");
        $stmt->execute(['id' => $reset['reset_id']]);

        $pdo->commit();

        error_log("[ResetPassword] ✅ Password " . ($isFirstTime ? 'IMPOSTATA' : 'REIMPOSTATA') . " per customer #{$reset['customer_id']} ({$reset['email']})");

        jsonResponse([
            'success' => true,
            'message' => $isFirstTime
                ? 'Password impostata con successo! Ora puoi accedere al tuo account.'
                : 'Password aggiornata con successo. Ora puoi accedere al tuo account.',
            'email' => $reset['email'],
            'isFirstTime' => $isFirstTime,
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log('[ResetPassword] ❌ Errore: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore interno. Riprova più tardi.',
        'detail' => IS_LOCAL ? $e->getMessage() : null
    ], 500);
}
