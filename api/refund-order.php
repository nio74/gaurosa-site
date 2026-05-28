<?php
/**
 * Endpoint rimborso ordine (chiamato da MazGest)
 *
 * POST /api/refund-order.php
 * Body JSON:
 *   {
 *     "api_key": "<SYNC_API_KEY>",
 *     "external_order_number": "GAU-20260527-006",
 *     "reason": "requested_by_customer" (opzionale)
 *   }
 *
 * Flow:
 * 1. Legge ordine da DB (no test mode: solo paid)
 * 2. Chiama Stripe POST /v1/refunds con payment_intent
 * 3. Aggiorna ordine status='cancelled', payment_status='refunded'
 * 4. Restore stock per ogni item dell'ordine (riavvia stock_helpers se serve)
 * 5. Idempotente: se gia' refunded, ritorna successo con flag already_refunded
 *
 * NB: il webhook Stripe charge.refunded arrivera' subito dopo come backup;
 *     viene gestito con check idempotenza (skip se gia' refunded).
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/checkout/stock-helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
}

// Auth via SYNC_API_KEY (stessa usata per sync prodotti/collezioni)
$apiKey = $input['api_key'] ?? ($_SERVER['HTTP_X_API_KEY'] ?? null);
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

$externalOrderNumber = trim($input['external_order_number'] ?? '');
$reason = $input['reason'] ?? 'requested_by_customer';
if ($externalOrderNumber === '') {
    jsonResponse(['success' => false, 'error' => 'external_order_number mancante'], 400);
}

$pdo = getDbConnection();

// 1. Recupera ordine
$stmt = $pdo->prepare("
    SELECT id, order_number, payment_id, payment_method, payment_status, status, total,
           customer_email, customer_name
    FROM orders
    WHERE order_number = :on
    LIMIT 1
");
$stmt->execute(['on' => $externalOrderNumber]);
$order = $stmt->fetch();

if (!$order) {
    jsonResponse(['success' => false, 'error' => "Ordine {$externalOrderNumber} non trovato"], 404);
}

// 2. Idempotenza: se gia' refunded, ritorna OK senza rifare nulla
if ($order['payment_status'] === 'refunded') {
    jsonResponse([
        'success' => true,
        'already_refunded' => true,
        'order_number' => $order['order_number'],
        'message' => 'Ordine gia rimborsato',
    ]);
}

// 3. Validazioni
if ($order['payment_status'] !== 'paid') {
    jsonResponse([
        'success' => false,
        'error' => "Ordine in stato '{$order['payment_status']}', non rimborsabile",
    ], 409);
}

$paymentMethod = strtolower($order['payment_method'] ?? '');
if (!in_array($paymentMethod, ['stripe', 'card', 'klarna'])) {
    // Bonifico/PayPal: per ora non implementati (PayPal sarebbe simile a Stripe)
    jsonResponse([
        'success' => false,
        'error' => "Rimborso automatico non supportato per metodo '{$paymentMethod}'. Procedere manualmente.",
    ], 400);
}

if (empty($order['payment_id'])) {
    jsonResponse(['success' => false, 'error' => 'payment_id mancante sull ordine'], 500);
}

// 4. Chiama Stripe API per il refund
$ch = curl_init('https://api.stripe.com/v1/refunds');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'payment_intent' => $order['payment_id'],
        'reason' => $reason,
        'metadata[order_number]' => $order['order_number'],
        'metadata[source]' => 'mazgest',
    ]),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . STRIPE_SECRET_KEY,
    ],
    CURLOPT_TIMEOUT => 30,
]);

$stripeResponse = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($curlError) {
    error_log("[Refund] cURL error: {$curlError}");
    jsonResponse(['success' => false, 'error' => 'Errore connessione Stripe'], 502);
}

$stripeData = json_decode($stripeResponse, true);

if ($httpCode !== 200) {
    $stripeError = $stripeData['error']['message'] ?? 'Errore sconosciuto';
    error_log("[Refund] Stripe HTTP {$httpCode}: {$stripeError}");
    jsonResponse([
        'success' => false,
        'error' => "Stripe: {$stripeError}",
        'detail' => IS_LOCAL ? $stripeData : null,
    ], 502);
}

$refundId = $stripeData['id'] ?? null;
$amountRefunded = ($stripeData['amount'] ?? 0) / 100;
error_log("[Refund] Stripe refund OK: {$refundId} per ordine {$order['order_number']} - {$amountRefunded} EUR");

// 5. Aggiorna ordine: status, payment_status, note
$noteTimestamp = date('Y-m-d H:i:s');
$noteText = "\n[Rimborso " . $noteTimestamp . " da MazGest] Stripe refund {$refundId} - {$amountRefunded} EUR";

$pdo->prepare("
    UPDATE orders
    SET payment_status = 'refunded',
        status = 'cancelled',
        internal_notes = CONCAT(COALESCE(internal_notes, ''), :note),
        updated_at = NOW(3)
    WHERE id = :id
")->execute([
    'id' => $order['id'],
    'note' => $noteText,
]);

// 6. Restore stock per ogni item
try {
    $restored = restoreOrderStock($pdo, (int)$order['id']);
    error_log("[Refund] Stock ripristinato per ordine #{$order['id']}: {$restored['restored']} righe");
} catch (Exception $stockErr) {
    error_log("[Refund] Errore restore stock ordine #{$order['id']}: " . $stockErr->getMessage());
    // Non blocco il rimborso, solo logga
}

jsonResponse([
    'success' => true,
    'order_number' => $order['order_number'],
    'stripe_refund_id' => $refundId,
    'amount_refunded_eur' => $amountRefunded,
    'message' => 'Ordine rimborsato',
]);
