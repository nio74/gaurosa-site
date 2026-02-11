<?php
/**
 * API Verifica Email - POST /api/auth/verify-email.php
 */

require_once __DIR__ . '/../config.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$token = trim($data['token'] ?? '');

if (empty($token)) {
    jsonResponse(['success' => false, 'error' => 'Token mancante'], 400);
}

try {
    $pdo = getDbConnection();

    // Cerca cliente con questo token
    $stmt = $pdo->prepare("
        SELECT id, email, first_name, email_verified, token_expires_at
        FROM customers
        WHERE verification_token = ?
        LIMIT 1
    ");
    $stmt->execute([$token]);
    $customer = $stmt->fetch();

    if (!$customer) {
        jsonResponse(['success' => false, 'error' => 'Token non valido'], 400);
    }

    // Verifica se già verificato
    if ($customer['email_verified']) {
        jsonResponse([
            'success' => true,
            'alreadyVerified' => true,
            'message' => 'Email già verificata'
        ]);
    }

    // Verifica scadenza token
    if (strtotime($customer['token_expires_at']) < time()) {
        jsonResponse(['success' => false, 'error' => 'Token scaduto. Richiedi un nuovo link di verifica.'], 400);
    }

    // Aggiorna cliente come verificato
    $stmt = $pdo->prepare("
        UPDATE customers
        SET email_verified = 1,
            email_verified_at = NOW(),
            verification_token = NULL,
            token_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$customer['id']]);

    // Sincronizza con MazGest
    syncCustomerToMazGest($customer['id']);

    jsonResponse([
        'success' => true,
        'message' => 'Email verificata con successo!'
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}

/**
 * Sincronizza cliente verificato con MazGest
 */
function syncCustomerToMazGest($customerId) {
    try {
        $pdo = getDbConnection();

        // Ottieni dati cliente
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();

        if (!$customer) return false;

        // Prepara dati per MazGest
        $mazgestData = [
            'nome' => $customer['first_name'],
            'cognome' => $customer['last_name'],
            'email' => $customer['email'],
            'cellulare' => $customer['phone'] ?? '',
            'consenso_marketing' => $customer['marketing_consent'] ? true : false,
            'origine_cliente' => 'ecommerce',
            'from_ecommerce' => true,
            'ecommerce_customer_id' => $customer['id']
        ];

        // Invia a MazGest
        $ch = curl_init(MAZGEST_API_URL . '/ecommerce/customers/sync');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($mazgestData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . MAZGEST_API_KEY
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            if (isset($result['mazgestId'])) {
                // Aggiorna mazgest_id nel database locale
                $stmt = $pdo->prepare("
                    UPDATE customers
                    SET mazgest_id = ?,
                        synced_at = NOW(),
                        sync_status = 'synced'
                    WHERE id = ?
                ");
                $stmt->execute([$result['mazgestId'], $customerId]);
                return true;
            }
        }

        // Log errore sync
        $stmt = $pdo->prepare("
            UPDATE customers
            SET sync_status = 'error',
                last_sync_error = ?
            WHERE id = ?
        ");
        $stmt->execute(['HTTP ' . $httpCode . ': ' . substr($response, 0, 200), $customerId]);

        return false;
    } catch (Exception $e) {
        return false;
    }
}
