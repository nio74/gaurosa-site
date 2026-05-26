<?php
/**
 * API Password dimenticata - POST /api/auth/forgot-password.php
 *
 * Body JSON: { "email": "user@example.com" }
 *
 * Genera un token univoco e salva in `password_resets`.
 * In ambiente locale (IS_LOCAL): logga il link reset nel server log invece di inviare email.
 * In produzione: invia email con link reset.
 *
 * Per security: risposta sempre `success: true` anche se email non esiste,
 * così non si rivelano account esistenti via enumeration attack.
 */

require_once __DIR__ . '/../config.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$email = strtolower(trim($data['email'] ?? ''));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Indirizzo email non valido'], 400);
}

// Risposta generica (non rivela se l'email esiste)
$genericSuccess = [
    'success' => true,
    'message' => 'Se l\'indirizzo email è registrato, riceverai a breve un\'email con le istruzioni per impostare la password.'
];

try {
    $pdo = getDbConnection();

    // Cerca customer per email
    $stmt = $pdo->prepare("SELECT id, email, first_name, password FROM customers WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $customer = $stmt->fetch();

    if (!$customer) {
        // Email sconosciuta: rispondiamo success (anti-enumeration in produzione)
        error_log("[ForgotPassword] Email non trovata: {$email}");
        if (IS_LOCAL) {
            // In DEV mostriamo info utile per debug (in PROD resta nascosto)
            $devResponse = $genericSuccess;
            $devResponse['dev_email_not_found'] = true;
            $devResponse['dev_note'] = "Questa email non esiste nel DB locale. In produzione l'utente vedrebbe lo stesso messaggio per security.";
            jsonResponse($devResponse);
        }
        jsonResponse($genericSuccess);
    }

    // Determina il tipo di operazione: imposta (mai avuta password) o reimposta
    $isFirstTime = empty($customer['password']);

    // Invalida eventuali token attivi precedenti (per sicurezza)
    $stmt = $pdo->prepare("UPDATE password_resets SET used_at = NOW(3) WHERE customer_id = :cid AND used_at IS NULL");
    $stmt->execute(['cid' => $customer['id']]);

    // Genera nuovo token (32 bytes hex = 64 char)
    $token = bin2hex(random_bytes(32));
    $expiresAt = (new DateTime('+1 hour'))->format('Y-m-d H:i:s.u');

    $stmt = $pdo->prepare("
        INSERT INTO password_resets (customer_id, token, expires_at, created_at)
        VALUES (:customer_id, :token, :expires_at, NOW(3))
    ");
    $stmt->execute([
        'customer_id' => $customer['id'],
        'token' => $token,
        'expires_at' => $expiresAt,
    ]);

    // Costruisci link reset
    $resetUrl = SITE_URL . '/account/reset-password/' . $token . '/';

    // In dev: logga il link, in prod: invia email
    if (IS_LOCAL) {
        error_log("[ForgotPassword] 🔗 LINK RESET DEV per {$email}: {$resetUrl}");
        error_log("[ForgotPassword] (Tipo: " . ($isFirstTime ? 'PRIMA IMPOSTAZIONE' : 'REIMPOSTAZIONE') . ")");

        // In dev includiamo il link nella risposta per facilitare il test
        $devResponse = $genericSuccess;
        $devResponse['dev_reset_url'] = $resetUrl;
        $devResponse['dev_is_first_time'] = $isFirstTime;
        jsonResponse($devResponse);
    } else {
        // Produzione: invia email reale
        $sent = sendPasswordResetEmail(
            $customer['email'],
            $customer['first_name'] ?? null,
            $resetUrl,
            $isFirstTime
        );
        if (!$sent) {
            error_log("[ForgotPassword] ⚠️ Errore invio email a {$email} (token comunque salvato)");
        }
        jsonResponse($genericSuccess);
    }

} catch (Exception $e) {
    error_log('[ForgotPassword] ❌ Errore: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore interno. Riprova più tardi.',
        'detail' => IS_LOCAL ? $e->getMessage() : null
    ], 500);
}

/**
 * Invia email con link reset password (chiamato solo in produzione).
 *
 * @param string $email
 * @param string|null $firstName
 * @param string $resetUrl
 * @param bool $isFirstTime Se true, l'utente non ha mai avuto una password (es. guest customer)
 */
function sendPasswordResetEmail($email, $firstName, $resetUrl, $isFirstTime) {
    $name = $firstName ? $firstName : 'cliente';
    $action = $isFirstTime ? 'imposta la tua password' : 'reimposta la tua password';
    $title = $isFirstTime ? 'Imposta la tua password Gaurosa' : 'Reimposta la tua password';

    $subject = $isFirstTime
        ? "Imposta la tua password Gaurosa"
        : "Reimposta la tua password Gaurosa";

    $intro = $isFirstTime
        ? "Hai effettuato un acquisto come ospite su Gaurosa. Per accedere al tuo account e vedere lo storico ordini, imposta una password cliccando il pulsante qui sotto:"
        : "Hai richiesto di reimpostare la tua password. Clicca il pulsante qui sotto per scegliere una nuova password:";

    $html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">';
    $html .= '<div style="max-width:600px;margin:0 auto;background:#ffffff;">';
    $html .= '<div style="background:#8b1538;padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">GAUROSA</h1></div>';
    $html .= '<div style="padding:30px;color:#333;line-height:1.6;">';
    $html .= '<h2 style="margin:0 0 15px;color:#8b1538;">' . $title . '</h2>';
    $html .= '<p>Ciao <strong>' . htmlspecialchars($name) . '</strong>,</p>';
    $html .= '<p>' . $intro . '</p>';
    $html .= '<div style="text-align:center;margin:30px 0;">';
    $html .= '<a href="' . $resetUrl . '" style="display:inline-block;background:#8b1538;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-weight:bold;">' . ucfirst($action) . '</a>';
    $html .= '</div>';
    $html .= '<p style="color:#666;font-size:14px;">Il link è valido per <strong>1 ora</strong>. Se non hai richiesto questa operazione puoi ignorare questa email.</p>';
    $html .= '<p style="color:#666;font-size:12px;margin-top:30px;">Se il pulsante non funziona, copia e incolla questo link nel browser:<br><span style="color:#8b1538;word-break:break-all;">' . $resetUrl . '</span></p>';
    $html .= '</div>';
    $html .= '<div style="background:#f5f5f5;padding:20px;text-align:center;color:#999;font-size:12px;">Gaurosa Gioielli - Via Don G. Carrara, 19 - 35010 Villa del Conte (PD)</div>';
    $html .= '</div></body></html>';

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    $headers .= "Reply-To: info@gaurosa.it\r\n";

    return @mail($email, $subject, $html, $headers);
}
