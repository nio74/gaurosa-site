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
