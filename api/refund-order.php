<?php
/**
 * Endpoint rimborso ordine AUTOMATICO (Stripe/Klarna o PayPal)
 *
 * Chiamato da MazGest quando l'operatore preme "Rimborsa" sul drawer ordini.
 *
 * POST /api/refund-order.php
 * Body JSON:
 *   {
 *     "api_key": "<SYNC_API_KEY>",
 *     "external_order_number": "GAU-20260527-006",
 *     "reason": "requested_by_customer" (opzionale)
 *   }
 *
 * Flow (in base a payment_method):
 *
 *   STRIPE / CARD / KLARNA:
 *     1. Idempotency check
 *     2. POST Stripe /v1/refunds con payment_intent (orders.payment_id)
 *     3. Update DB (refunded/cancelled, note) + restore stock
 *     4. Webhook Stripe charge.refunded arriva come backup (idempotent skip)
 *
 *   PAYPAL:
 *     1. Idempotency check
 *     2. OAuth2: POST /v1/oauth2/token (client_credentials) -> access_token
 *     3. POST PayPal /v2/payments/captures/{capture_id}/refund con Bearer
 *        (capture_id = orders.payment_reference, NON payment_id!)
 *     4. Update DB + restore stock
 *     5. No webhook PayPal -> questa chiamata e' l'unica fonte di verita'
 *
 * Per metodi non gestiti (bonifico, ecc.) usare refund-order-manual.php.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/checkout/stock-helpers.php';

/**
 * Ottiene access_token PayPal via OAuth2 client_credentials.
 * Stessa logica gia' presente in checkout/capture-paypal-order.php
 * (duplicata qui per mantenere il file autonomo - se in futuro si vuole
 * un singolo helper estrarre in api/lib/paypal-helpers.php).
 *
 * @return string|null access_token oppure null se errore
 */
function refundGetPayPalAccessToken(): ?string {
    $ch = curl_init(PAYPAL_API_URL . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => PAYPAL_CLIENT_ID . ':' . PAYPAL_SECRET,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError || $httpCode !== 200) {
        error_log("[Refund-PayPal] OAuth error ({$httpCode}): {$curlError} - Response: {$response}");
        return null;
    }

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

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

// 1. Recupera ordine (include payment_reference per PayPal capture_id)
$stmt = $pdo->prepare("
    SELECT id, order_number, payment_id, payment_reference, payment_method, payment_status, status, total,
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
$isStripeFlow = in_array($paymentMethod, ['stripe', 'card', 'klarna']);
$isPayPalFlow = ($paymentMethod === 'paypal');

if (!$isStripeFlow && !$isPayPalFlow) {
    // Bonifico/altri: usa refund-order-manual.php
    jsonResponse([
        'success' => false,
        'error' => "Rimborso automatico non supportato per metodo '{$paymentMethod}'. Usa refund-order-manual.php.",
    ], 400);
}

// ============================================================================
// FLOW PAYPAL
// ============================================================================
if ($isPayPalFlow) {
    // Il capture_id e' salvato in payment_reference, NON in payment_id
    // (vedi capture-paypal-order.php lines 138-156: extract da
    //  purchase_units[0].payments.captures[0].id)
    $captureId = trim($order['payment_reference'] ?? '');
    if (empty($captureId)) {
        jsonResponse([
            'success' => false,
            'error' => 'capture_id PayPal (payment_reference) mancante sull ordine. Procedere manualmente da pannello PayPal.',
        ], 500);
    }

    // 4a. OAuth2: ottieni access_token
    $accessToken = refundGetPayPalAccessToken();
    if (!$accessToken) {
        jsonResponse([
            'success' => false,
            'error' => 'Errore autenticazione PayPal (OAuth2 fallito)',
        ], 502);
    }

    // 4b. Chiama PayPal refund API
    $refundUrl = PAYPAL_API_URL . "/v2/payments/captures/{$captureId}/refund";
    // Body vuoto = refund TOTALE. Per parziale: {"amount":{"value":"X.XX","currency_code":"EUR"}}
    $refundBody = json_encode([
        'note_to_payer' => 'Rimborso ordine ' . $order['order_number'],
        'invoice_id' => $order['order_number'],
    ]);

    $ch = curl_init($refundUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $refundBody,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
            'Prefer: return=representation',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $paypalResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("[Refund-PayPal] cURL error: {$curlError}");
        jsonResponse(['success' => false, 'error' => 'Errore connessione PayPal'], 502);
    }

    $paypalData = json_decode($paypalResponse, true);

    // PayPal restituisce 201 in caso di successo (non 200 come Stripe)
    if ($httpCode !== 200 && $httpCode !== 201) {
        $paypalError = $paypalData['message'] ?? ($paypalData['name'] ?? 'Errore sconosciuto');
        $paypalDetails = isset($paypalData['details'][0]['description'])
            ? ' - ' . $paypalData['details'][0]['description']
            : '';
        error_log("[Refund-PayPal] HTTP {$httpCode}: {$paypalError}{$paypalDetails} - " . json_encode($paypalData));
        jsonResponse([
            'success' => false,
            'error' => "PayPal: {$paypalError}{$paypalDetails}",
            'detail' => IS_LOCAL ? $paypalData : null,
        ], 502);
    }

    $refundId = $paypalData['id'] ?? null;
    $refundStatus = $paypalData['status'] ?? 'unknown';
    $amountRefunded = isset($paypalData['amount']['value'])
        ? (float)$paypalData['amount']['value']
        : (float)$order['total'];
    error_log("[Refund-PayPal] OK: {$refundId} status={$refundStatus} per ordine {$order['order_number']} - {$amountRefunded} EUR");

    // 5a. Aggiorna ordine
    $noteTimestamp = date('Y-m-d H:i:s');
    $noteText = "\n[Rimborso " . $noteTimestamp . " da MazGest] PayPal refund {$refundId} (status: {$refundStatus}) - {$amountRefunded} EUR";

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

    // 6a. Restore stock
    try {
        $restored = restoreOrderStock($pdo, (int)$order['id']);
        error_log("[Refund-PayPal] Stock ripristinato per ordine #{$order['id']}: {$restored['restored']} righe");
    } catch (Exception $stockErr) {
        error_log("[Refund-PayPal] Errore restore stock ordine #{$order['id']}: " . $stockErr->getMessage());
    }

    jsonResponse([
        'success' => true,
        'order_number' => $order['order_number'],
        'paypal_refund_id' => $refundId,
        'paypal_refund_status' => $refundStatus,
        'amount_refunded_eur' => $amountRefunded,
        'message' => 'Ordine rimborsato via PayPal',
    ]);
}

// ============================================================================
// FLOW STRIPE / CARD / KLARNA
// ============================================================================
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
