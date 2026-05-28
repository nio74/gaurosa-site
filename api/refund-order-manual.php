<?php
/**
 * Endpoint rimborso ordine MANUALE (bonifico / PayPal)
 *
 * Chiamato da MazGest quando l'operatore preme "Rimborsa (manuale)".
 *
 * Differenza vs refund-order.php:
 *  - NESSUNA chiamata a Stripe (i soldi non sono mai passati da Stripe).
 *  - Solo update DB (status=cancelled, payment_status=refunded) + restore stock.
 *  - L'operatore deve poi fare a mano:
 *      - per bonifico: bonifico inverso al cliente dal proprio home banking
 *      - per PayPal: rimborso dal pannello PayPal (https://paypal.com/activity)
 *
 * POST /api/refund-order-manual.php
 * Body JSON:
 *   {
 *     "api_key": "<SYNC_API_KEY>",
 *     "external_order_number": "GAU-20260528-004",
 *     "reason": "requested_by_customer" (opzionale)
 *   }
 *
 * Sicurezza:
 *   - Auth via SYNC_API_KEY (stessa di refund-order.php).
 *   - Valida che payment_method sia bonifico/bank_transfer/paypal — non si puo' usare
 *     questo endpoint per metodi Stripe (eviterebbe i soldi a Stripe!).
 *   - Idempotente: se gia' refunded, ritorna already_refunded=true.
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

// Auth via SYNC_API_KEY
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

// 2. Idempotenza: se gia' refunded, ritorna OK
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
if (!in_array($paymentMethod, ['bonifico', 'bank_transfer', 'paypal'])) {
    // Per stripe/card/klarna esiste refund-order.php che chiama davvero Stripe
    jsonResponse([
        'success' => false,
        'error' => "Rimborso manuale non applicabile a metodo '{$paymentMethod}'. Usa refund-order.php (Stripe automatico).",
    ], 400);
}

// 4. Aggiorna ordine: status, payment_status, note con promemoria
$noteTimestamp = date('Y-m-d H:i:s');
$methodLabel = strtoupper($paymentMethod);
$action = ($paymentMethod === 'paypal')
    ? 'effettuare il rimborso dal pannello PayPal'
    : 'effettuare il bonifico inverso dal proprio home banking';
$noteText = "\n[Rimborso MANUALE {$methodLabel} {$noteTimestamp} da MazGest] "
          . "Importo: {$order['total']} EUR. "
          . "PROMEMORIA: l'operatore deve {$action} per restituire i soldi al cliente.";

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

error_log("[Refund-Manual] Ordine {$order['order_number']} ({$paymentMethod}) marcato refunded. Restituzione manuale a carico operatore.");

// 5. Restore stock per ogni item
try {
    $restored = restoreOrderStock($pdo, (int)$order['id']);
    error_log("[Refund-Manual] Stock ripristinato per ordine #{$order['id']}: {$restored['restored']} righe");
} catch (Exception $stockErr) {
    error_log("[Refund-Manual] Errore restore stock ordine #{$order['id']}: " . $stockErr->getMessage());
    // Non blocco il rimborso, solo logga
}

jsonResponse([
    'success' => true,
    'order_number' => $order['order_number'],
    'manual' => true,
    'payment_method' => $paymentMethod,
    'amount_refunded_eur' => (float)$order['total'],
    'message' => "Ordine marcato come rimborsato. Effettuare {$action} per importo {$order['total']} EUR.",
]);
