<?php
/**
 * API Verifica token reset - GET /api/auth/verify-reset-token.php?token=...
 *
 * Verifica se un token reset è valido SENZA consumarlo.
 * Usato dal frontend per:
 * 1. Mostrare errore precoce se link è scaduto/usato (UX migliore)
 * 2. Decidere il testo del pulsante: "Imposta password" vs "Cambia password"
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$token = trim($_GET['token'] ?? '');

if (empty($token)) {
    jsonResponse(['success' => false, 'error' => 'Token mancante'], 400);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT pr.expires_at, pr.used_at, c.email, c.password AS current_password, c.first_name
        FROM password_resets pr
        JOIN customers c ON c.id = pr.customer_id
        WHERE pr.token = :token
        LIMIT 1
    ");
    $stmt->execute(['token' => $token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        jsonResponse(['success' => false, 'valid' => false, 'error' => 'Link non valido'], 400);
    }

    if ($reset['used_at'] !== null) {
        jsonResponse(['success' => false, 'valid' => false, 'error' => 'Questo link è già stato utilizzato'], 400);
    }

    if (strtotime($reset['expires_at']) < time()) {
        jsonResponse(['success' => false, 'valid' => false, 'error' => 'Il link è scaduto'], 400);
    }

    $isFirstTime = empty($reset['current_password']);

    jsonResponse([
        'success' => true,
        'valid' => true,
        'email' => $reset['email'],
        'firstName' => $reset['first_name'],
        'isFirstTime' => $isFirstTime,
        'expiresAt' => $reset['expires_at'],
    ]);

} catch (Exception $e) {
    error_log('[VerifyResetToken] ❌ Errore: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'valid' => false,
        'error' => 'Errore interno',
    ], 500);
}
