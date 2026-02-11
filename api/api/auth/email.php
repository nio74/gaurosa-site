<?php
/**
 * Email Helper - Invio email con SMTP
 */

require_once __DIR__ . '/../config.php';

/**
 * Invia email di verifica
 */
function sendVerificationEmail($to, $firstName, $verificationUrl) {
    $subject = 'Verifica il tuo account - Gaurosa Gioielli';

    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4af37; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #d4af37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: #d4af37; margin: 0;">Gaurosa Gioielli</h1>
            </div>
            <div class="content">
                <h2>Ciao ' . htmlspecialchars($firstName) . '!</h2>
                <p>Grazie per esserti registrato su Gaurosa Gioielli.</p>
                <p>Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:</p>
                <p style="text-align: center; padding: 20px 0;">
                    <a href="' . htmlspecialchars($verificationUrl) . '" class="button">Verifica Email</a>
                </p>
                <p>Oppure copia e incolla questo link nel tuo browser:</p>
                <p style="word-break: break-all; color: #666;">' . htmlspecialchars($verificationUrl) . '</p>
                <p><strong>Nota:</strong> Questo link scade tra 24 ore.</p>
            </div>
            <div class="footer">
                <p>Gaurosa Gioielli - Via Example 123, Padova</p>
                <p>Se non hai richiesto questa registrazione, ignora questa email.</p>
            </div>
        </div>
    </body>
    </html>';

    return sendEmail($to, $subject, $htmlBody);
}

/**
 * Invia email generica via SMTP
 */
function sendEmail($to, $subject, $htmlBody) {
    // Headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM . '>',
        'Reply-To: ' . EMAIL_FROM,
        'X-Mailer: PHP/' . phpversion()
    ];

    // In produzione su Hostinger, mail() funziona direttamente
    // Per sviluppo locale, potrebbe essere necessario configurare SMTP
    $isLocal = strpos($_SERVER['HTTP_HOST'] ?? 'localhost', 'localhost') !== false;

    if ($isLocal) {
        // In locale, logga invece di inviare
        error_log("EMAIL TO: $to");
        error_log("SUBJECT: $subject");
        error_log("BODY: " . substr(strip_tags($htmlBody), 0, 200) . "...");
        return true; // Simula successo in locale
    }

    // Produzione - usa mail() di PHP (Hostinger lo configura automaticamente)
    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

/**
 * Invia email di reset password
 */
function sendPasswordResetEmail($to, $firstName, $resetUrl) {
    $subject = 'Reset Password - Gaurosa Gioielli';

    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4af37; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #d4af37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: #d4af37; margin: 0;">Gaurosa Gioielli</h1>
            </div>
            <div class="content">
                <h2>Ciao ' . htmlspecialchars($firstName) . '!</h2>
                <p>Hai richiesto di reimpostare la password del tuo account.</p>
                <p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
                <p style="text-align: center; padding: 20px 0;">
                    <a href="' . htmlspecialchars($resetUrl) . '" class="button">Reimposta Password</a>
                </p>
                <p><strong>Nota:</strong> Questo link scade tra 1 ora.</p>
                <p>Se non hai richiesto il reset della password, ignora questa email.</p>
            </div>
            <div class="footer">
                <p>Gaurosa Gioielli</p>
            </div>
        </div>
    </body>
    </html>';

    return sendEmail($to, $subject, $htmlBody);
}
