<?php
/**
 * API Get Current User - GET /api/auth/me.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Richiede autenticazione
$authUser = requireAuth();

try {
    $pdo = getDbConnection();

    // Ottieni dati aggiornati del cliente
    $stmt = $pdo->prepare("
        SELECT id, email, first_name, last_name, phone,
               customer_type, ragione_sociale, codice_fiscale, partita_iva,
               billing_address, billing_city, billing_province, billing_postcode, billing_country,
               shipping_address, shipping_city, shipping_province, shipping_postcode, shipping_country,
               marketing_consent, created_at, last_login_at
        FROM customers
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$authUser['id']]);
    $customer = $stmt->fetch();

    if (!$customer) {
        jsonResponse(['success' => false, 'error' => 'Utente non trovato'], 404);
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $customer['id'],
            'email' => $customer['email'],
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'phone' => $customer['phone'],
            'emailVerified' => true,
            'customerType' => $customer['customer_type'],
            'ragioneSociale' => $customer['ragione_sociale'],
            'codiceFiscale' => $customer['codice_fiscale'],
            'partitaIva' => $customer['partita_iva'],
            'billingAddress' => [
                'address' => $customer['billing_address'],
                'city' => $customer['billing_city'],
                'province' => $customer['billing_province'],
                'postcode' => $customer['billing_postcode'],
                'country' => $customer['billing_country']
            ],
            'shippingAddress' => [
                'address' => $customer['shipping_address'],
                'city' => $customer['shipping_city'],
                'province' => $customer['shipping_province'],
                'postcode' => $customer['shipping_postcode'],
                'country' => $customer['shipping_country']
            ],
            'marketingConsent' => (bool)$customer['marketing_consent'],
            'createdAt' => $customer['created_at'],
            'lastLoginAt' => $customer['last_login_at']
        ]
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
