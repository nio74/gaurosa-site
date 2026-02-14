<?php
/**
 * API Sync - GET /api/sync/pending-customers.php
 * 
 * Returns customers that need to be synced to MazGest.
 * Called by MazGest PULL system to import new/updated customers.
 * 
 * Only returns customers that:
 * - Have email_verified = 1 (confirmed email or Google OAuth)
 * - Have sync_status = 'pending' or 'error' (not yet synced or failed)
 * 
 * Query params:
 * - limit: max customers to return (default 50)
 * 
 * Requires x-api-key header for authentication.
 */

require_once __DIR__ . '/../config.php';

// Only GET
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Verify API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== SYNC_API_KEY && $apiKey !== MAZGEST_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

try {
    $pdo = getDbConnection();
    $limit = min(intval($_GET['limit'] ?? 50), 200);

    // Get customers that need syncing:
    // - email verified (confirmed account)
    // - not yet synced or sync failed
    $stmt = $pdo->prepare("
        SELECT 
            id, email, first_name, last_name, phone,
            auth_provider, provider_id, avatar_url,
            email_verified, privacy_consent, marketing_consent,
            customer_type, ragione_sociale, codice_fiscale, partita_iva,
            codice_sdi, pec,
            billing_address, billing_city, billing_province, billing_postcode, billing_country,
            shipping_address, shipping_city, shipping_province, shipping_postcode, shipping_country,
            mazgest_id, sync_status, last_sync_error,
            created_at, updated_at
        FROM customers
        WHERE email_verified = 1
          AND (sync_status = 'pending' OR sync_status = 'error')
        ORDER BY created_at ASC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    $customers = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => [
            'customers' => $customers,
            'count' => count($customers),
            'has_more' => count($customers) >= $limit
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in pending-customers.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore del server'], 500);
}
