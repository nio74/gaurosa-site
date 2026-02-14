<?php
/**
 * API Google Sign-In - POST /api/auth/google.php
 *
 * Receives Google ID token (credential) from Google Identity Services,
 * verifies it with Google's tokeninfo endpoint, and creates/logs in the user.
 *
 * Flow:
 * 1. Frontend gets credential from Google Sign-In popup
 * 2. Frontend POSTs { credential: "..." } to this endpoint
 * 3. We verify the token with Google
 * 4. Find or create customer
 * 5. Return JWT + user data
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$credential = $data['credential'] ?? '';

if (empty($credential)) {
    jsonResponse(['success' => false, 'error' => 'Token Google mancante'], 400);
}

try {
    // ============================================
    // 1. Verify Google ID token
    // ============================================
    $googlePayload = verifyGoogleToken($credential);

    if (!$googlePayload) {
        jsonResponse(['success' => false, 'error' => 'Token Google non valido'], 401);
    }

    $googleId = $googlePayload['sub']; // Unique Google user ID
    $email = strtolower(trim($googlePayload['email']));
    $emailVerified = $googlePayload['email_verified'] ?? false;
    $firstName = $googlePayload['given_name'] ?? '';
    $lastName = $googlePayload['family_name'] ?? '';
    $avatarUrl = $googlePayload['picture'] ?? null;

    if (!$email) {
        jsonResponse(['success' => false, 'error' => 'Email non disponibile dal profilo Google'], 400);
    }

    $pdo = getDbConnection();

    // ============================================
    // 2. Find existing customer
    // ============================================

    // First: search by provider_id (exact match for returning Google users)
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE auth_provider = 'google' AND provider_id = ? LIMIT 1");
    $stmt->execute([$googleId]);
    $customer = $stmt->fetch();

    if (!$customer) {
        // Second: search by email (might have registered with email+password before)
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $customer = $stmt->fetch();
    }

    $isNew = false;

    if ($customer) {
        // ============================================
        // 3a. Existing customer - link/update
        // ============================================

        $updateFields = [];
        $updateParams = [];

        // If registered with email+password, link Google account
        if ($customer['auth_provider'] === 'email') {
            $updateFields[] = "auth_provider = 'google'";
            $updateFields[] = "provider_id = ?";
            $updateParams[] = $googleId;
        }

        // Update avatar if not set
        if (empty($customer['avatar_url']) && $avatarUrl) {
            $updateFields[] = "avatar_url = ?";
            $updateParams[] = $avatarUrl;
        }

        // Mark email as verified (Google already verified it)
        if (!$customer['email_verified']) {
            $updateFields[] = "email_verified = 1";
            $updateFields[] = "email_verified_at = NOW()";
            $updateFields[] = "verification_token = NULL";
            $updateFields[] = "token_expires_at = NULL";
        }

        // Update name if missing
        if (empty($customer['first_name']) && $firstName) {
            $updateFields[] = "first_name = ?";
            $updateParams[] = $firstName;
        }
        if (empty($customer['last_name']) && $lastName) {
            $updateFields[] = "last_name = ?";
            $updateParams[] = $lastName;
        }

        // Always update last login
        $updateFields[] = "last_login_at = NOW()";
        $updateFields[] = "updated_at = NOW()";

        if (!empty($updateFields)) {
            $updateParams[] = $customer['id'];
            $sql = "UPDATE customers SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($updateParams);
        }

        // Re-fetch updated customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customer['id']]);
        $customer = $stmt->fetch();

        // Sync to MazGest if not yet synced
        if (empty($customer['mazgest_id'])) {
            syncOAuthCustomerToMazGest($customer);
        }

    } else {
        // ============================================
        // 3b. New customer - create
        // ============================================
        $isNew = true;

        $stmt = $pdo->prepare("
            INSERT INTO customers (
                email, first_name, last_name,
                auth_provider, provider_id, avatar_url,
                email_verified, email_verified_at,
                privacy_consent, privacy_consent_at,
                from_website, created_at, updated_at, last_login_at
            ) VALUES (
                ?, ?, ?,
                'google', ?, ?,
                1, NOW(),
                1, NOW(),
                1, NOW(), NOW(), NOW()
            )
        ");
        $stmt->execute([$email, $firstName, $lastName, $googleId, $avatarUrl]);

        $customerId = $pdo->lastInsertId();

        // Fetch the new customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();

        // Sync new customer to MazGest
        syncOAuthCustomerToMazGest($customer);
    }

    // ============================================
    // 4. Create JWT and set cookies
    // ============================================
    $accessToken = createJWT([
        'id' => $customer['id'],
        'email' => $customer['email'],
        'firstName' => $customer['first_name'],
        'lastName' => $customer['last_name']
    ]);

    $refreshToken = generateRefreshToken();
    setAuthCookies($accessToken, $refreshToken);

    // ============================================
    // 5. Return user data
    // ============================================
    jsonResponse([
        'success' => true,
        'isNew' => $isNew,
        'user' => [
            'id' => $customer['id'],
            'email' => $customer['email'],
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'phone' => $customer['phone'],
            'avatarUrl' => $customer['avatar_url'],
            'emailVerified' => (bool)$customer['email_verified'],
            'authProvider' => $customer['auth_provider']
        ]
    ]);

} catch (Exception $e) {
    error_log('Google auth error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore durante l\'accesso con Google'], 500);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify Google ID token using Google's tokeninfo endpoint
 */
function verifyGoogleToken($idToken) {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return false;
    }

    $payload = json_decode($response, true);

    if (!$payload || !isset($payload['sub'])) {
        return false;
    }

    // Verify the token was issued for our app
    if (($payload['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
        error_log('Google token aud mismatch: expected ' . GOOGLE_CLIENT_ID . ', got ' . ($payload['aud'] ?? 'none'));
        return false;
    }

    return $payload;
}

/**
 * Sync OAuth customer to MazGest (same as verify-email.php but for OAuth users)
 */
function syncOAuthCustomerToMazGest($customer) {
    try {
        $mazgestData = [
            'firstName' => $customer['first_name'] ?? '',
            'lastName' => $customer['last_name'] ?? '',
            'email' => $customer['email'],
            'phone' => $customer['phone'] ?? '',
            'marketingConsent' => false,
            'siteCustomerId' => $customer['id'],
            'authProvider' => $customer['auth_provider'] ?? 'google'
        ];

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
                $pdo = getDbConnection();
                $pdo->prepare("
                    UPDATE customers SET mazgest_id = ?, synced_at = NOW(), sync_status = 'synced' WHERE id = ?
                ")->execute([$result['mazgestId'], $customer['id']]);
            }
        } else {
            $pdo = getDbConnection();
            $pdo->prepare("
                UPDATE customers SET sync_status = 'error', last_sync_error = ? WHERE id = ?
            ")->execute(['HTTP ' . $httpCode . ': ' . substr($response ?? '', 0, 200), $customer['id']]);
        }
    } catch (Exception $e) {
        error_log('MazGest sync error for OAuth customer: ' . $e->getMessage());
    }
}
