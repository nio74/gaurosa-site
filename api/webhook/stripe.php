<?php
/**
 * Webhook Stripe - Backup per conferma pagamenti
 * 
 * POST /api/webhook/stripe
 * 
 * Riceve eventi da Stripe (configurati nella Stripe Dashboard).
 * Gestisce principalmente 'payment_intent.succeeded' come backup
 * nel caso in cui il client non riesca a chiamare confirm-order.
 * 
 * IMPORTANTE: Questo endpoint deve SEMPRE ritornare 200 OK a Stripe,
 * altrimenti Stripe ritenterà la consegna dell'evento.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../checkout/order-email.php';

// Webhook non usa CORS / OPTIONS - è server-to-server
// Ma gestiamo comunque le headers per sicurezza
header('Content-Type: application/json');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// =====================================================
// LEGGI E VERIFICA EVENTO
// =====================================================

$rawBody = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Log dell'evento ricevuto (utile per debug)
error_log("[Stripe Webhook] Evento ricevuto - Signature: " . substr($sigHeader, 0, 30) . "...");

// Verifica firma webhook (se configurata)
$event = null;
if (STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET !== 'whsec_placeholder' && STRIPE_WEBHOOK_SECRET !== 'whsec_CHANGE_ME') {
    // Verifica la firma Stripe
    $verified = verifyStripeSignature($rawBody, $sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!$verified) {
        error_log("[Stripe Webhook] ERRORE: Firma non valida!");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
}

$event = json_decode($rawBody, true);

if (!$event || empty($event['type'])) {
    error_log("[Stripe Webhook] ERRORE: Payload non valido");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

$eventType = $event['type'];
$eventId = $event['id'] ?? 'unknown';
error_log("[Stripe Webhook] Tipo evento: {$eventType} (ID: {$eventId})");

// =====================================================
// GESTIONE EVENTI
// =====================================================

try {
    switch ($eventType) {

        case 'payment_intent.succeeded':
            handlePaymentIntentSucceeded($event['data']['object']);
            break;

        case 'payment_intent.payment_failed':
            handlePaymentIntentFailed($event['data']['object']);
            break;

        case 'charge.refunded':
            handleChargeRefunded($event['data']['object']);
            break;

        default:
            // Evento non gestito - logga e ignora
            error_log("[Stripe Webhook] Evento non gestito: {$eventType}");
            break;
    }
} catch (Exception $e) {
    // Logga errore ma rispondi comunque 200 per evitare retry inutili
    error_log("[Stripe Webhook] ERRORE gestione evento {$eventType}: " . $e->getMessage());
}

// Rispondi SEMPRE 200 OK a Stripe
http_response_code(200);
echo json_encode(['received' => true]);
exit;

// =====================================================
// HANDLER EVENTI
// =====================================================

/**
 * Gestisce payment_intent.succeeded
 * Aggiorna ordine a 'processing' / 'paid' se non già fatto da confirm-order
 */
function handlePaymentIntentSucceeded($paymentIntent) {
    $piId = $paymentIntent['id'] ?? null;
    if (!$piId) {
        error_log("[Stripe Webhook] payment_intent.succeeded senza ID");
        return;
    }

    $orderNumber = $paymentIntent['metadata']['order_number'] ?? null;
    $chargeId = $paymentIntent['latest_charge'] ?? null;

    error_log("[Stripe Webhook] Payment Intent succeeded: {$piId} (Ordine: {$orderNumber})");

    $pdo = getDbConnection();

    // Trova ordine tramite payment_id
    $stmt = $pdo->prepare("
        SELECT id, order_number, payment_status, status 
        FROM orders 
        WHERE payment_id = :payment_id 
        LIMIT 1
    ");
    $stmt->execute(['payment_id' => $piId]);
    $order = $stmt->fetch();

    if (!$order) {
        error_log("[Stripe Webhook] Ordine non trovato per PI: {$piId}");
        return;
    }

    // Se già pagato, non fare nulla (confirm-order ha già gestito)
    if ($order['payment_status'] === 'paid') {
        error_log("[Stripe Webhook] Ordine {$order['order_number']} già pagato - skip");
        return;
    }

    // Aggiorna ordine a pagato
    $updateStmt = $pdo->prepare("
        UPDATE orders 
        SET status = 'processing',
            payment_status = 'paid',
            paid_at = NOW(3),
            payment_reference = :charge_id,
            updated_at = NOW(3)
        WHERE id = :id AND payment_status != 'paid'
    ");
    $updateStmt->execute([
        'id' => $order['id'],
        'charge_id' => $chargeId,
    ]);

    $affected = $updateStmt->rowCount();
    if ($affected > 0) {
        error_log("[Stripe Webhook] Ordine {$order['order_number']} aggiornato a PAID (via webhook)");

        // Send confirmation email as backup (if not already sent by confirm-order)
        try {
            sendOrderConfirmationEmail($pdo, $order['id']);
        } catch (Exception $emailError) {
            error_log("[Stripe Webhook] ⚠️ Errore invio email backup: " . $emailError->getMessage());
        }
    } else {
        error_log("[Stripe Webhook] Ordine {$order['order_number']} non aggiornato (race condition o già paid)");
    }
}

/**
 * Gestisce payment_intent.payment_failed
 * Aggiorna lo stato di pagamento dell'ordine
 */
function handlePaymentIntentFailed($paymentIntent) {
    $piId = $paymentIntent['id'] ?? null;
    if (!$piId) return;

    $lastError = $paymentIntent['last_payment_error']['message'] ?? 'Errore sconosciuto';
    error_log("[Stripe Webhook] Payment Intent FAILED: {$piId} - {$lastError}");

    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, order_number, payment_status 
        FROM orders 
        WHERE payment_id = :payment_id 
        LIMIT 1
    ");
    $stmt->execute(['payment_id' => $piId]);
    $order = $stmt->fetch();

    if (!$order) {
        error_log("[Stripe Webhook] Ordine non trovato per PI fallito: {$piId}");
        return;
    }

    // Non sovrascrivere ordini già pagati
    if ($order['payment_status'] === 'paid') {
        error_log("[Stripe Webhook] Ordine {$order['order_number']} già pagato, ignoro evento failed");
        return;
    }

    $updateStmt = $pdo->prepare("
        UPDATE orders 
        SET payment_status = 'failed',
            internal_notes = CONCAT(COALESCE(internal_notes, ''), :note),
            updated_at = NOW(3)
        WHERE id = :id
    ");
    $updateStmt->execute([
        'id' => $order['id'],
        'note' => "\n[Webhook " . date('Y-m-d H:i:s') . "] Pagamento fallito: {$lastError}",
    ]);

    error_log("[Stripe Webhook] Ordine {$order['order_number']} segnato come FAILED");
}

/**
 * Gestisce charge.refunded
 * Aggiorna lo stato di pagamento dell'ordine
 */
function handleChargeRefunded($charge) {
    $piId = $charge['payment_intent'] ?? null;
    if (!$piId) return;

    $amountRefunded = ($charge['amount_refunded'] ?? 0) / 100;
    $amountTotal = ($charge['amount'] ?? 0) / 100;
    $isFullRefund = $charge['refunded'] ?? false;

    error_log("[Stripe Webhook] Charge refunded per PI: {$piId} - Rimborsato: {$amountRefunded} EUR su {$amountTotal} EUR");

    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, order_number 
        FROM orders 
        WHERE payment_id = :payment_id 
        LIMIT 1
    ");
    $stmt->execute(['payment_id' => $piId]);
    $order = $stmt->fetch();

    if (!$order) {
        error_log("[Stripe Webhook] Ordine non trovato per rimborso PI: {$piId}");
        return;
    }

    $newPaymentStatus = $isFullRefund ? 'refunded' : 'partially_refunded';
    $newStatus = $isFullRefund ? 'cancelled' : $order['status'] ?? 'processing';

    $updateStmt = $pdo->prepare("
        UPDATE orders 
        SET payment_status = :payment_status,
            status = :status,
            internal_notes = CONCAT(COALESCE(internal_notes, ''), :note),
            updated_at = NOW(3)
        WHERE id = :id
    ");
    $updateStmt->execute([
        'id' => $order['id'],
        'payment_status' => $newPaymentStatus,
        'status' => $newStatus,
        'note' => "\n[Webhook " . date('Y-m-d H:i:s') . "] Rimborso: {$amountRefunded} EUR" . ($isFullRefund ? " (completo)" : " (parziale)"),
    ]);

    error_log("[Stripe Webhook] Ordine {$order['order_number']} aggiornato: {$newPaymentStatus}");
}

// =====================================================
// UTILITY
// =====================================================

/**
 * Verifica la firma Stripe del webhook
 * @see https://stripe.com/docs/webhooks/signatures
 */
function verifyStripeSignature($payload, $sigHeader, $secret) {
    if (empty($sigHeader)) return false;

    // Parse header: t=timestamp,v1=signature
    $elements = explode(',', $sigHeader);
    $timestamp = null;
    $signatures = [];

    foreach ($elements as $element) {
        $parts = explode('=', $element, 2);
        if (count($parts) !== 2) continue;

        if ($parts[0] === 't') {
            $timestamp = (int)$parts[1];
        } elseif ($parts[0] === 'v1') {
            $signatures[] = $parts[1];
        }
    }

    if (!$timestamp || empty($signatures)) return false;

    // Tollera massimo 5 minuti di differenza
    $tolerance = 300;
    if (abs(time() - $timestamp) > $tolerance) {
        error_log("[Stripe Webhook] Firma scaduta: timestamp {$timestamp} vs now " . time());
        return false;
    }

    // Calcola firma attesa
    $signedPayload = "{$timestamp}.{$payload}";
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

    // Verifica contro tutte le firme v1
    foreach ($signatures as $sig) {
        if (hash_equals($expectedSignature, $sig)) {
            return true;
        }
    }

    return false;
}
