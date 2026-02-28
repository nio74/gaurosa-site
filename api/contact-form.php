<?php
/**
 * Contact Form Handler
 * Handles form submissions for: reso, incisioni, cambio-taglia
 * Sends email to assistenza@gaurosa.it via SMTP
 */

require_once __DIR__ . '/config.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$body = getJsonBody();

$type = trim($body['type'] ?? '');
if (!in_array($type, ['reso', 'incisioni', 'cambio-taglia'])) {
    jsonResponse(['success' => false, 'error' => 'Tipo modulo non valido'], 400);
}

// ─── Build email content based on type ───────────────────────────────────────

switch ($type) {
    case 'reso':
        $subject = 'Richiesta Reso - Ordine #' . sanitize($body['numero_ordine'] ?? '');
        $emailBody = buildResoEmail($body);
        break;

    case 'incisioni':
        $subject = 'Richiesta Incisione - Ordine #' . sanitize($body['numero_ordine'] ?? '');
        $emailBody = buildIncisioniEmail($body);
        break;

    case 'cambio-taglia':
        $subject = 'Richiesta Cambio Taglia - Ordine #' . sanitize($body['numero_ordine'] ?? '');
        $emailBody = buildCambioTagliaEmail($body);
        break;
}

// ─── Send email via SMTP ──────────────────────────────────────────────────────

$sent = sendEmail('assistenza@gaurosa.it', 'Assistenza Gaurosa', $subject, $emailBody);

if ($sent) {
    jsonResponse(['success' => true, 'message' => 'Richiesta inviata con successo. Ti risponderemo entro 24 ore lavorative.']);
} else {
    jsonResponse(['success' => false, 'error' => 'Errore nell\'invio dell\'email. Riprova o contattaci direttamente.'], 500);
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildResoEmail(array $data): string {
    $ordine    = sanitize($data['numero_ordine'] ?? 'N/D');
    $prodotto  = sanitize($data['prodotto'] ?? 'N/D');
    $motivo    = sanitize($data['motivo'] ?? 'N/D');
    $descr     = sanitize($data['descrizione'] ?? '');
    $nome      = sanitize($data['nome'] ?? 'N/D');
    $email     = sanitize($data['email'] ?? 'N/D');

    return emailTemplate('Richiesta di Reso', [
        'Nome cliente'    => $nome,
        'Email'           => $email,
        'Numero ordine'   => $ordine,
        'Prodotto'        => $prodotto,
        'Motivo del reso' => $motivo,
        'Descrizione'     => $descr ?: '—',
    ]);
}

function buildIncisioniEmail(array $data): string {
    $ordine   = sanitize($data['numero_ordine'] ?? 'N/D');
    $prodotto = sanitize($data['codice_prodotto'] ?? 'N/D');
    $testo    = sanitize($data['testo_incisione'] ?? 'N/D');
    $font     = sanitize($data['font'] ?? 'N/D');
    $note     = sanitize($data['note'] ?? '');
    $nome     = sanitize($data['nome'] ?? 'N/D');
    $email    = sanitize($data['email'] ?? 'N/D');

    return emailTemplate('Richiesta Incisione', [
        'Nome cliente'    => $nome,
        'Email'           => $email,
        'Numero ordine'   => $ordine,
        'Codice prodotto' => $prodotto,
        'Testo incisione' => $testo,
        'Font preferito'  => $font,
        'Note aggiuntive' => $note ?: '—',
    ]);
}

function buildCambioTagliaEmail(array $data): string {
    $ordine   = sanitize($data['numero_ordine'] ?? 'N/D');
    $prodotto = sanitize($data['codice_prodotto'] ?? 'N/D');
    $attuale  = sanitize($data['misura_attuale'] ?? 'N/D');
    $desider  = sanitize($data['misura_desiderata'] ?? 'N/D');
    $note     = sanitize($data['note'] ?? '');
    $nome     = sanitize($data['nome'] ?? 'N/D');
    $email    = sanitize($data['email'] ?? 'N/D');

    return emailTemplate('Richiesta Cambio Taglia', [
        'Nome cliente'     => $nome,
        'Email'            => $email,
        'Numero ordine'    => $ordine,
        'Codice prodotto'  => $prodotto,
        'Misura attuale'   => $attuale,
        'Misura desiderata'=> $desider,
        'Note'             => $note ?: '—',
    ]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

function emailTemplate(string $title, array $fields): string {
    $rows = '';
    foreach ($fields as $label => $value) {
        $rows .= "
        <tr>
          <td style='padding:8px 12px;font-weight:600;color:#555;background:#f9f9f9;width:40%;border-bottom:1px solid #eee;'>{$label}</td>
          <td style='padding:8px 12px;color:#333;border-bottom:1px solid #eee;'>{$value}</td>
        </tr>";
    }

    return "
<!DOCTYPE html>
<html lang='it'>
<head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
    <div style='background:#c9748a;padding:24px 32px;'>
      <h1 style='color:#fff;margin:0;font-size:22px;'>{$title}</h1>
      <p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;'>Ricevuto da gaurosa.it</p>
    </div>
    <div style='padding:24px 32px;'>
      <table style='width:100%;border-collapse:collapse;font-size:14px;'>
        {$rows}
      </table>
    </div>
    <div style='padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;'>
      <p style='margin:0;font-size:12px;color:#999;'>
        Email automatica generata da gaurosa.it — non rispondere a questo messaggio.
      </p>
    </div>
  </div>
</body>
</html>";
}

/**
 * Send email via SMTP using PHPMailer-compatible socket approach.
 * Falls back to PHP mail() if SMTP constants are not set.
 */
function sendEmail(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
    // Use PHPMailer if available (Hostinger usually has it via Composer)
    $phpmailerPath = __DIR__ . '/../vendor/autoload.php';
    if (file_exists($phpmailerPath)) {
        require_once $phpmailerPath;
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USER;
            $mail->Password   = SMTP_PASS;
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = SMTP_PORT;
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(EMAIL_FROM, EMAIL_FROM_NAME);
            $mail->addAddress($toEmail, $toName);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (\Exception $e) {
            error_log('[contact-form] PHPMailer error: ' . $e->getMessage());
            return false;
        }
    }

    // Fallback: native mail() — works on Hostinger shared hosting
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    $headers .= "Reply-To: " . EMAIL_FROM . "\r\n";

    return mail($toEmail, $subject, $htmlBody, $headers);
}
