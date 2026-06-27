<?php
/**
 * Withdrawal Requests Handler — Pulsante di Recesso (art. 54-bis Cod. Consumo)
 *
 * POST: riceve una dichiarazione di recesso dal consumatore, la registra,
 * e invia (a) al cliente una conferma su supporto durevole con il testo della
 * dichiarazione + data/ora di ricezione, (b) al negozio una notifica.
 *
 * Conforme al D.Lgs. 209/2025 (Direttiva UE 2023/2673), in vigore dal 19/06/2026.
 * Il recesso si considera validamente esercitato all'invio della dichiarazione;
 * la conferma via email è l'avviso di ricevimento su supporto durevole richiesto.
 */

require_once __DIR__ . '/config.php';

const SHOP_NOTIFY_EMAIL = 'assistenza@gaurosa.it';

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$body = getJsonBody();

$nome          = wr_sanitize($body['nome'] ?? '');
$email         = wr_sanitize($body['email'] ?? '');
$numeroOrdine  = wr_sanitize($body['numero_ordine'] ?? '');
$beni          = wr_sanitize($body['beni'] ?? '');
$dataOrdine    = wr_sanitize($body['data_ordine'] ?? '');
$consenso      = $body['consenso'] ?? false;
$conferma      = $body['conferma_recesso'] ?? false;

// Validazione
$errors = [];
if ($nome === '')         $errors[] = 'nome';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if ($numeroOrdine === '') $errors[] = 'numero ordine';
if ($beni === '')         $errors[] = 'beni acquistati';
if (!empty($errors)) {
    jsonResponse(['success' => false, 'error' => 'Campi mancanti o non validi: ' . implode(', ', $errors)], 400);
}
// Doppia conferma esplicita ("Conferma recesso")
if ($conferma !== true && $conferma !== 'true' && $conferma !== 1 && $conferma !== '1') {
    jsonResponse(['success' => false, 'error' => 'È necessario confermare il recesso ("Conferma recesso").'], 400);
}
if ($consenso !== true && $consenso !== 'true' && $consenso !== 1 && $consenso !== '1') {
    jsonResponse(['success' => false, 'error' => 'È necessario accettare il trattamento dei dati per la richiesta.'], 400);
}

// Timestamp ricezione (data + ora) — elemento richiesto dalla norma
$receivedAtDb  = date('Y-m-d H:i:s');
$receivedAtIt  = date('d/m/Y H:i:s');

// Testo della dichiarazione di recesso (modulo tipo Allegato I.B Cod. Consumo)
$ordineInfo = $dataOrdine !== '' ? "ordine n. {$numeroOrdine} del {$dataOrdine}" : "ordine n. {$numeroOrdine}";
$declaration =
    "Con la presente io sottoscritto/a {$nome} notifico il recesso dal mio contratto " .
    "di vendita dei seguenti beni: {$beni} ({$ordineInfo}). " .
    "Dichiarazione ricevuta da gaurosa.it il {$receivedAtIt}.";

// Salvataggio (non deve impedire l'esercizio del recesso se fallisce: si logga)
$savedId = null;
try {
    $pdo = getDbConnection();
    // Risali al customer_id se l'email corrisponde a un cliente (opzionale)
    $customerId = null;
    try {
        $cs = $pdo->prepare("SELECT id FROM customers WHERE email = :email LIMIT 1");
        $cs->execute(['email' => $email]);
        $row = $cs->fetch();
        if ($row) $customerId = (int) $row['id'];
    } catch (Exception $e) { /* tabella/colonna assente: ignora */ }

    $stmt = $pdo->prepare("
        INSERT INTO withdrawal_requests
            (order_number, customer_name, customer_email, customer_id, items, declaration_text, received_at, status, created_at)
        VALUES
            (:order_number, :customer_name, :customer_email, :customer_id, :items, :declaration_text, :received_at, 'ricevuto', NOW())
    ");
    $stmt->execute([
        'order_number'     => $numeroOrdine,
        'customer_name'    => $nome,
        'customer_email'   => $email,
        'customer_id'      => $customerId,
        'items'            => $beni,
        'declaration_text' => $declaration,
        'received_at'      => $receivedAtDb,
    ]);
    $savedId = (int) $pdo->lastInsertId();
} catch (Exception $e) {
    error_log('[withdrawal-requests] DB insert error: ' . $e->getMessage());
    // Non blocchiamo: il recesso è valido all'invio. Proseguiamo con le email.
}

// Email di CONFERMA al cliente (supporto durevole) — obbligatoria
$customerSubject = 'Conferma di recesso ricevuta - Ordine ' . $numeroOrdine;
$customerBody = wr_emailTemplate('Conferma di recesso', [
    'Stato'                  => 'Richiesta di recesso ricevuta',
    'Data e ora ricezione'   => $receivedAtIt,
    'Numero ordine'          => $numeroOrdine,
    'Beni'                   => $beni,
    'Dichiarazione'          => $declaration,
], 'Abbiamo registrato il tuo recesso. Conserva questa email come ricevuta. ' .
   'Ti contatteremo per le istruzioni di restituzione e il rimborso.');
$customerSent = wr_sendEmail($email, $nome, $customerSubject, $customerBody);

// Email di NOTIFICA al negozio
$shopSubject = 'NUOVA richiesta di RECESSO - Ordine ' . $numeroOrdine;
$shopBody = wr_emailTemplate('Nuova richiesta di recesso', [
    'Cliente'              => $nome,
    'Email'                => $email,
    'Numero ordine'        => $numeroOrdine,
    'Beni'                 => $beni,
    'Data e ora ricezione' => $receivedAtIt,
    'ID richiesta'         => $savedId !== null ? (string) $savedId : 'non salvato (vedi log)',
    'Dichiarazione'        => $declaration,
], 'Gestire la pratica di recesso: contattare il cliente per reso e rimborso (entro i termini di legge).');
wr_sendEmail(SHOP_NOTIFY_EMAIL, 'Assistenza Gaurosa', $shopSubject, $shopBody);

jsonResponse([
    'success' => true,
    'message' => 'Recesso registrato. Ti abbiamo inviato una email di conferma con il testo della dichiarazione e la data/ora di ricezione.',
    'data' => [
        'id'            => $savedId,
        'received_at'   => $receivedAtIt,
        'email_sent'    => $customerSent,
    ],
]);

// ─── Helpers (locali a questo endpoint) ──────────────────────────────────────

function wr_sanitize($value): string {
    return htmlspecialchars(strip_tags(trim((string) $value)), ENT_QUOTES, 'UTF-8');
}

function wr_emailTemplate(string $title, array $fields, string $intro = ''): string {
    $rows = '';
    foreach ($fields as $label => $value) {
        $rows .= "
        <tr>
          <td style='padding:8px 12px;font-weight:600;color:#555;background:#f9f9f9;width:38%;border-bottom:1px solid #eee;vertical-align:top;'>{$label}</td>
          <td style='padding:8px 12px;color:#333;border-bottom:1px solid #eee;'>{$value}</td>
        </tr>";
    }
    $introHtml = $intro !== '' ? "<p style='margin:0 0 16px;color:#444;font-size:14px;'>{$intro}</p>" : '';
    return "
<!DOCTYPE html>
<html lang='it'>
<head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
    <div style='background:#c9748a;padding:24px 32px;'>
      <h1 style='color:#fff;margin:0;font-size:22px;'>{$title}</h1>
      <p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;'>gaurosa.it</p>
    </div>
    <div style='padding:24px 32px;'>
      {$introHtml}
      <table style='width:100%;border-collapse:collapse;font-size:14px;'>
        {$rows}
      </table>
    </div>
    <div style='padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;'>
      <p style='margin:0;font-size:12px;color:#999;'>
        Email automatica generata da gaurosa.it relativa al diritto di recesso (art. 54-bis Cod. Consumo).
      </p>
    </div>
  </div>
</body>
</html>";
}

function wr_sendEmail(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
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
            error_log('[withdrawal-requests] PHPMailer error: ' . $e->getMessage());
            return false;
        }
    }
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    $headers .= "Reply-To: " . EMAIL_FROM . "\r\n";
    // @ per non far trapelare warning (es. SMTP non raggiungibile in dev) nella risposta JSON
    return @mail($toEmail, $subject, $htmlBody, $headers);
}
