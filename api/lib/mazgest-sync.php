<?php
/**
 * Sincronizzazione clienti con MazGest
 * Shared helper usato da register.php e verify-email.php
 */

require_once __DIR__ . '/../config.php';

/**
 * Sincronizza cliente con MazGest
 *
 * @param int $customerId ID cliente nel database locale
 * @return bool true se sync riuscita, false altrimenti
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
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'] ?? '',
            'marketingConsent' => $customer['marketing_consent'] ? true : false,
            'siteCustomerId' => $customer['id'],
            'authProvider' => $customer['auth_provider'] ?? 'email'
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
        $curlError = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // Debug logging
        error_log("[MazGest Sync] Customer ID: $customerId, URL: " . MAZGEST_API_URL . '/ecommerce/customers/sync');
        error_log("[MazGest Sync] HTTP Code: $httpCode, Response: " . substr($response, 0, 500));
        if ($curlError) {
            error_log("[MazGest Sync] cURL Error: $curlError");
        }

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
        error_log("[MazGest Sync] Exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Trova o crea un record cliente per l'ordine passato.
 * Usato dai flow Stripe/PayPal/Klarna in confirm-order.php e capture-paypal-order.php
 * per replicare il comportamento gia' presente in create-bank-transfer-order.php:
 * dopo il pagamento confermato, l'ordine deve avere un customer_id e
 * il cliente deve essere sincronizzato verso MazGest.
 *
 * $order: array dall'ordine (richiede customer_email, customer_name, customer_phone,
 *         billing_address e shipping_address come JSON string).
 * Ritorna l'id del customer (esistente o nuovo) oppure null se non e' stato possibile.
 */
function ensureCustomerForOrder(PDO $pdo, array $order): ?int {
    // Se l'ordine ha gia' customer_id valorizzato, niente da fare
    if (!empty($order['customer_id'])) {
        return (int)$order['customer_id'];
    }

    $email = strtolower(trim($order['customer_email'] ?? ''));
    if ($email === '') {
        return null;
    }

    // 1) Cerca per email
    $stmt = $pdo->prepare("SELECT id FROM customers WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $existing = $stmt->fetch();
    if ($existing) {
        return (int)$existing['id'];
    }

    // 2) Crea guest customer senza password
    $billing = json_decode($order['billing_address'] ?? '{}', true) ?: [];
    $shipping = json_decode($order['shipping_address'] ?? '{}', true) ?: [];

    $nameParts = explode(' ', trim($order['customer_name'] ?? ''), 2);
    $firstName = $nameParts[0] ?? null;
    $lastName = $nameParts[1] ?? null;

    $stmt = $pdo->prepare("
        INSERT INTO customers (
            email, first_name, last_name, phone,
            billing_address, billing_city, billing_province, billing_postcode, billing_country,
            shipping_address, shipping_city, shipping_province, shipping_postcode, shipping_country,
            password, email_verified, from_website,
            privacy_consent, privacy_consent_at,
            marketing_consent, consented_at,
            auth_provider, sync_status,
            created_at, updated_at
        ) VALUES (
            :email, :first_name, :last_name, :phone,
            :b_address, :b_city, :b_province, :b_postcode, :b_country,
            :s_address, :s_city, :s_province, :s_postcode, :s_country,
            NULL, 0, 1,
            1, NOW(3),
            0, NULL,
            'email', 'pending',
            NOW(3), NOW(3)
        )
    ");
    $stmt->execute([
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'phone' => $order['customer_phone'] ?? null,
        'b_address' => $billing['address'] ?? null,
        'b_city' => $billing['city'] ?? null,
        'b_province' => $billing['province'] ?? null,
        'b_postcode' => $billing['postalCode'] ?? null,
        'b_country' => substr($billing['country'] ?? 'IT', 0, 2),
        's_address' => $shipping['address'] ?? null,
        's_city' => $shipping['city'] ?? null,
        's_province' => $shipping['province'] ?? null,
        's_postcode' => $shipping['postalCode'] ?? null,
        's_country' => substr($shipping['country'] ?? 'IT', 0, 2),
    ]);

    $id = (int)$pdo->lastInsertId();
    error_log("[MazGest Sync] ✨ Creato customer guest #{$id} per email {$email} (da " . ($order['payment_method'] ?? 'unknown') . ")");
    return $id;
}
