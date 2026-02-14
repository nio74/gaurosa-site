<?php
/**
 * API Apple Sign-In - POST /api/auth/apple.php
 *
 * Receives Apple ID token from Sign in with Apple JS,
 * verifies it with Apple's public keys (JWKS), and creates/logs in the user.
 *
 * Flow:
 * 1. Frontend gets authorization from Apple Sign-In popup
 * 2. Frontend POSTs { id_token: "...", user: { name: { firstName, lastName } } }
 *    Note: Apple only sends the user's name on FIRST authorization
 * 3. We verify the token with Apple's JWKS
 * 4. Find or create customer
 * 5. Return JWT + user data
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

$data = getJsonBody();
$idToken = $data['id_token'] ?? '';
$userData = $data['user'] ?? null; // Only available on first authorization

if (empty($idToken)) {
    jsonResponse(['success' => false, 'error' => 'Token Apple mancante'], 400);
}

try {
    // ============================================
    // 1. Verify Apple ID token
    // ============================================
    $applePayload = verifyAppleToken($idToken);

    if (!$applePayload) {
        jsonResponse(['success' => false, 'error' => 'Token Apple non valido'], 401);
    }

    $appleId = $applePayload['sub']; // Unique Apple user ID
    $email = strtolower(trim($applePayload['email'] ?? ''));
    $isPrivateRelay = strpos($email, '@privaterelay.appleid.com') !== false;

    // Apple only sends name on first authorization
    $firstName = $userData['name']['firstName'] ?? '';
    $lastName = $userData['name']['lastName'] ?? '';

    if (!$email && !$appleId) {
        jsonResponse(['success' => false, 'error' => 'Dati insufficienti dal profilo Apple'], 400);
    }

    $pdo = getDbConnection();

    // ============================================
    // 2. Find existing customer
    // ============================================

    // First: search by provider_id (exact match for returning Apple users)
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE auth_provider = 'apple' AND provider_id = ? LIMIT 1");
    $stmt->execute([$appleId]);
    $customer = $stmt->fetch();

    if (!$customer && $email) {
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

        // If registered with email+password, link Apple account
        if ($customer['auth_provider'] === 'email') {
            $updateFields[] = "auth_provider = 'apple'";
            $updateFields[] = "provider_id = ?";
            $updateParams[] = $appleId;
        }

        // Mark email as verified (Apple already verified it)
        if (!$customer['email_verified']) {
            $updateFields[] = "email_verified = 1";
            $updateFields[] = "email_verified_at = NOW()";
            $updateFields[] = "verification_token = NULL";
            $updateFields[] = "token_expires_at = NULL";
        }

        // Update name if missing (Apple only sends name on first auth)
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

    } else {
        // ============================================
        // 3b. New customer - create
        // ============================================
        $isNew = true;

        // If Apple hides email, use the relay address
        $customerEmail = $email ?: ($appleId . '@apple.privaterelay');

        $stmt = $pdo->prepare("
            INSERT INTO customers (
                email, first_name, last_name,
                auth_provider, provider_id,
                email_verified, email_verified_at,
                from_website, created_at, updated_at, last_login_at
            ) VALUES (
                ?, ?, ?,
                'apple', ?,
                1, NOW(),
                1, NOW(), NOW(), NOW()
            )
        ");
        $stmt->execute([$customerEmail, $firstName, $lastName, $appleId]);

        $customerId = $pdo->lastInsertId();

        // Fetch the new customer
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();

        // Sync new customer to MazGest
        syncAppleCustomerToMazGest($customer);
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
    error_log('Apple auth error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore durante l\'accesso con Apple'], 500);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify Apple ID token using Apple's JWKS (JSON Web Key Set)
 */
function verifyAppleToken($idToken) {
    // Decode token header to get kid (key ID)
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) return false;

    $header = json_decode(base64UrlDecode($parts[0]), true);
    if (!$header || !isset($header['kid'])) return false;

    // Fetch Apple's public keys
    $ch = curl_init('https://appleid.apple.com/auth/keys');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $jwks = json_decode($response, true);
    if (!$jwks || !isset($jwks['keys'])) return false;

    // Find the matching key
    $matchingKey = null;
    foreach ($jwks['keys'] as $key) {
        if ($key['kid'] === $header['kid']) {
            $matchingKey = $key;
            break;
        }
    }

    if (!$matchingKey) return false;

    // Convert JWK to PEM public key
    $publicKey = jwkToPem($matchingKey);
    if (!$publicKey) return false;

    // Verify signature
    $payload = base64UrlDecode($parts[1]);
    $signature = base64UrlDecode($parts[2]);
    $dataToVerify = $parts[0] . '.' . $parts[1];

    $valid = openssl_verify($dataToVerify, $signature, $publicKey, OPENSSL_ALGO_SHA256);

    if ($valid !== 1) return false;

    $claims = json_decode($payload, true);
    if (!$claims) return false;

    // Verify claims
    if (($claims['iss'] ?? '') !== 'https://appleid.apple.com') return false;
    if (($claims['aud'] ?? '') !== APPLE_CLIENT_ID) return false;
    if (($claims['exp'] ?? 0) < time()) return false;

    return $claims;
}

/**
 * Convert JWK (JSON Web Key) RSA key to PEM format
 */
function jwkToPem($jwk) {
    if (($jwk['kty'] ?? '') !== 'RSA') return false;

    $n = base64UrlDecode($jwk['n']);
    $e = base64UrlDecode($jwk['e']);

    // Build DER-encoded RSA public key
    $modulus = ltrim($n, "\x00");
    if (ord($modulus[0]) > 0x7f) {
        $modulus = "\x00" . $modulus;
    }

    $exponent = ltrim($e, "\x00");
    if (ord($exponent[0]) > 0x7f) {
        $exponent = "\x00" . $exponent;
    }

    $modulus = derEncodeInteger($modulus);
    $exponent = derEncodeInteger($exponent);

    $rsaPublicKey = derEncodeSequence($modulus . $exponent);

    // Wrap in SubjectPublicKeyInfo
    $algorithmIdentifier = derEncodeSequence(
        derEncodeOid("\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01") . "\x05\x00" // RSA + NULL
    );

    $bitString = "\x00" . $rsaPublicKey;
    $bitString = "\x03" . derEncodeLength(strlen($bitString)) . $bitString;

    $der = derEncodeSequence($algorithmIdentifier . $bitString);

    $pem = "-----BEGIN PUBLIC KEY-----\n";
    $pem .= chunk_split(base64_encode($der), 64, "\n");
    $pem .= "-----END PUBLIC KEY-----\n";

    return $pem;
}

function derEncodeLength($length) {
    if ($length < 0x80) return chr($length);
    $temp = ltrim(pack('N', $length), "\x00");
    return chr(0x80 | strlen($temp)) . $temp;
}

function derEncodeInteger($data) {
    return "\x02" . derEncodeLength(strlen($data)) . $data;
}

function derEncodeSequence($data) {
    return "\x30" . derEncodeLength(strlen($data)) . $data;
}

function derEncodeOid($oid) {
    return "\x06" . derEncodeLength(strlen($oid)) . $oid;
}

/**
 * Base64 URL decode (same as jwt.php but needed here standalone)
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Sync Apple customer to MazGest
 */
function syncAppleCustomerToMazGest($customer) {
    try {
        $mazgestData = [
            'nome' => $customer['first_name'] ?? '',
            'cognome' => $customer['last_name'] ?? '',
            'email' => $customer['email'],
            'cellulare' => $customer['phone'] ?? '',
            'consenso_marketing' => false,
            'origine_cliente' => 'ecommerce',
            'from_ecommerce' => true,
            'ecommerce_customer_id' => $customer['id'],
            'auth_provider' => 'apple'
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
        }
    } catch (Exception $e) {
        error_log('MazGest sync error for Apple customer: ' . $e->getMessage());
    }
}
