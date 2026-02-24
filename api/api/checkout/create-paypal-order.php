<?php
/**
 * Crea ordine PayPal e ordine pendente nel database
 * 
 * POST /api/checkout/create-paypal-order
 * 
 * Body JSON: same as create-payment-intent.php but paymentMethod = 'paypal'
 * 
 * Returns: {success, paypalOrderId, orderId, orderNumber, totals}
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/jwt.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

$body = getJsonBody();

// =====================================================
// VALIDAZIONE INPUT (same as create-payment-intent)
// =====================================================

$items = $body['items'] ?? [];
$customer = $body['customer'] ?? [];
$shippingAddress = $body['shippingAddress'] ?? null;
$billingAddress = $body['billingAddress'] ?? null;
$requiresInvoice = (bool)($body['requiresInvoice'] ?? false);
$invoiceData = $body['invoiceData'] ?? null;
$notes = trim($body['notes'] ?? '');

// Validazione items
if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'Il carrello è vuoto'], 400);
}

foreach ($items as $i => $item) {
    if (empty($item['productCode']) || empty($item['name'])) {
        jsonResponse(['success' => false, 'error' => "Articolo #" . ($i + 1) . ": dati prodotto mancanti"], 400);
    }
    if (!isset($item['quantity']) || (int)$item['quantity'] < 1) {
        jsonResponse(['success' => false, 'error' => "Articolo #" . ($i + 1) . ": quantità non valida"], 400);
    }
    if (!isset($item['unitPrice']) || (float)$item['unitPrice'] <= 0) {
        jsonResponse(['success' => false, 'error' => "Articolo #" . ($i + 1) . ": prezzo non valido"], 400);
    }
}

// Validazione customer
if (empty($customer['email']) || !filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Indirizzo email non valido'], 400);
}
if (empty($customer['name'])) {
    jsonResponse(['success' => false, 'error' => 'Nome cliente obbligatorio'], 400);
}

// Validazione indirizzo spedizione
if (!$shippingAddress || empty($shippingAddress['address']) || empty($shippingAddress['city']) 
    || empty($shippingAddress['postalCode']) || empty($shippingAddress['country'])) {
    jsonResponse(['success' => false, 'error' => 'Indirizzo di spedizione incompleto'], 400);
}

// Se fattura richiesta, validare dati fattura
if ($requiresInvoice) {
    if (!$invoiceData || empty($invoiceData['type'])) {
        jsonResponse(['success' => false, 'error' => 'Tipo fattura obbligatorio (privato o azienda)'], 400);
    }
    if ($invoiceData['type'] === 'azienda') {
        if (empty($invoiceData['ragioneSociale'])) {
            jsonResponse(['success' => false, 'error' => 'Ragione sociale obbligatoria per fattura azienda'], 400);
        }
        if (empty($invoiceData['partitaIva'])) {
            jsonResponse(['success' => false, 'error' => 'Partita IVA obbligatoria per fattura azienda'], 400);
        }
    } else {
        if (empty($invoiceData['codiceFiscale'])) {
            jsonResponse(['success' => false, 'error' => 'Codice fiscale obbligatorio per fattura privato'], 400);
        }
    }
}

// Se indirizzo di fatturazione non fornito, usa quello di spedizione
if (!$billingAddress) {
    $billingAddress = $shippingAddress;
}

// =====================================================
// CALCOLO TOTALI SERVER-SIDE
// =====================================================

try {
    $pdo = getDbConnection();

    // Verifica prezzi e stock dal database per ogni articolo
    $subtotal = 0;
    $validatedItems = [];

    foreach ($items as $item) {
        $productCode = $item['productCode'];
        $variantSku = $item['variantSku'] ?? null;
        $quantity = (int)$item['quantity'];
        $clientUnitPrice = round((float)$item['unitPrice'], 2);

        // Recupera prezzo dal database
        if ($variantSku) {
            $stmt = $pdo->prepare("
                SELECT p.id as product_id, p.code, p.name, p.price as product_price, p.stock as product_stock,
                       pv.id as variant_id, pv.sku, pv.name as variant_name, pv.price as variant_price, 
                       pv.stock as variant_stock, pv.is_virtual
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.id
                WHERE p.code = :code AND pv.sku = :sku
                LIMIT 1
            ");
            $stmt->execute(['code' => $productCode, 'sku' => $variantSku]);
        } else {
            $stmt = $pdo->prepare("
                SELECT p.id as product_id, p.code, p.name, p.price as product_price, p.stock as product_stock,
                       NULL as variant_id, NULL as sku, NULL as variant_name, NULL as variant_price, 
                       NULL as variant_stock, 0 as is_virtual
                FROM products p
                WHERE p.code = :code
                LIMIT 1
            ");
            $stmt->execute(['code' => $productCode]);
        }

        $dbProduct = $stmt->fetch();
        if (!$dbProduct) {
            jsonResponse([
                'success' => false, 
                'error' => "Prodotto '{$item['name']}' non trovato o non disponibile"
            ], 400);
        }

        $dbPrice = $dbProduct['variant_price'] !== null 
            ? round((float)$dbProduct['variant_price'], 2) 
            : round((float)$dbProduct['product_price'], 2);

        if (abs($clientUnitPrice - $dbPrice) > 0.01) {
            jsonResponse([
                'success' => false, 
                'error' => "Il prezzo di '{$item['name']}' è cambiato. Aggiorna il carrello.",
                'detail' => IS_LOCAL ? "Client: {$clientUnitPrice}, DB: {$dbPrice}" : null
            ], 409);
        }

        $availableStock = $dbProduct['variant_stock'] !== null 
            ? (int)$dbProduct['variant_stock'] 
            : (int)$dbProduct['product_stock'];

        if ($availableStock < $quantity) {
            $stockMsg = $availableStock === 0 
                ? "'{$item['name']}' non è più disponibile" 
                : "'{$item['name']}' disponibile solo in {$availableStock} pezzi";
            jsonResponse(['success' => false, 'error' => $stockMsg], 409);
        }

        $lineTotal = round($dbPrice * $quantity, 2);
        $subtotal += $lineTotal;

        $validatedItems[] = [
            'productId' => (int)$dbProduct['product_id'],
            'productCode' => $dbProduct['code'],
            'productName' => $dbProduct['name'],
            'variantSku' => $dbProduct['sku'] ?? ($item['variantSku'] ?? null),
            'variantName' => $dbProduct['variant_name'] ?? ($item['variantName'] ?? null),
            'isVirtualVariant' => (bool)($item['isVirtualVariant'] ?? $dbProduct['is_virtual']),
            'orderedSize' => $item['orderedSize'] ?? null,
            'quantity' => $quantity,
            'unitPrice' => $dbPrice,
            'totalPrice' => $lineTotal,
        ];
    }

    $subtotal = round($subtotal, 2);
    $shippingTotal = $subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : SHIPPING_COST;
    $totalBeforeTax = $subtotal + $shippingTotal;
    $taxTotal = round($totalBeforeTax * 22 / 122, 2);
    $discountTotal = 0.00;
    $total = round($subtotal + $shippingTotal, 2);

    if ($total < 0.50) {
        jsonResponse(['success' => false, 'error' => "L'importo minimo dell'ordine è 0,50 €"], 400);
    }

    // =====================================================
    // GENERA NUMERO ORDINE
    // =====================================================

    $today = date('Ymd');
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE order_number LIKE :prefix
    ");
    $stmt->execute(['prefix' => "GAU-{$today}-%"]);
    $countToday = (int)$stmt->fetch()['count'];
    $orderNumber = sprintf("GAU-%s-%03d", $today, $countToday + 1);

    // =====================================================
    // DETERMINA CUSTOMER ID (se autenticato)
    // =====================================================

    $authUser = getAuthUser();
    $customerId = null;
    $isGuest = true;

    if ($authUser && isset($authUser['id'])) {
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $authUser['id']]);
        $dbCustomer = $stmt->fetch();
        if ($dbCustomer) {
            $customerId = (int)$dbCustomer['id'];
            $isGuest = false;
        }
    }

    // =====================================================
    // OTTIENI ACCESS TOKEN PAYPAL
    // =====================================================

    $authToken = getPayPalAccessToken();
    if (!$authToken) {
        jsonResponse(['success' => false, 'error' => 'Errore di connessione a PayPal'], 502);
    }

    // =====================================================
    // CREA ORDINE SU PAYPAL
    // =====================================================

    // Build PayPal items array
    $paypalItems = [];
    foreach ($validatedItems as $vItem) {
        $itemName = $vItem['productName'];
        if ($vItem['variantName']) {
            $itemName .= ' - ' . $vItem['variantName'];
        }
        if ($vItem['orderedSize']) {
            $itemName .= ' (Taglia: ' . $vItem['orderedSize'] . ')';
        }
        // PayPal limits item name to 127 chars
        if (strlen($itemName) > 127) {
            $itemName = substr($itemName, 0, 124) . '...';
        }

        $paypalItems[] = [
            'name' => $itemName,
            'unit_amount' => [
                'currency_code' => 'EUR',
                'value' => number_format($vItem['unitPrice'], 2, '.', ''),
            ],
            'quantity' => (string)$vItem['quantity'],
            'sku' => $vItem['productCode'],
        ];
    }

    // Split customer name for PayPal
    $nameParts = explode(' ', $customer['name'], 2);
    $firstName = $nameParts[0] ?? '';
    $lastName = $nameParts[1] ?? $nameParts[0] ?? '';

    $paypalOrderBody = [
        'intent' => 'CAPTURE',
        'purchase_units' => [
            [
                'reference_id' => $orderNumber,
                'description' => "Ordine {$orderNumber} - Gaurosa Gioielli",
                'custom_id' => $orderNumber,
                'amount' => [
                    'currency_code' => 'EUR',
                    'value' => number_format($total, 2, '.', ''),
                    'breakdown' => [
                        'item_total' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($subtotal, 2, '.', ''),
                        ],
                        'shipping' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($shippingTotal, 2, '.', ''),
                        ],
                        'discount' => [
                            'currency_code' => 'EUR',
                            'value' => number_format($discountTotal, 2, '.', ''),
                        ],
                    ],
                ],
                'items' => $paypalItems,
                'shipping' => [
                    'name' => [
                        'full_name' => $customer['name'],
                    ],
                    'address' => [
                        'address_line_1' => $shippingAddress['address'],
                        'admin_area_2' => $shippingAddress['city'],
                        'admin_area_1' => $shippingAddress['province'],
                        'postal_code' => $shippingAddress['postalCode'],
                        'country_code' => 'IT',
                    ],
                ],
            ],
        ],
        'payment_source' => [
            'paypal' => [
                'experience_context' => [
                    'payment_method_preference' => 'IMMEDIATE_PAYMENT_REQUIRED',
                    'brand_name' => 'Gaurosa Gioielli',
                    'locale' => 'it-IT',
                    'landing_page' => 'LOGIN',
                    'user_action' => 'PAY_NOW',
                    'return_url' => SITE_URL . '/ordine/conferma',
                    'cancel_url' => SITE_URL . '/checkout',
                ],
                'email_address' => $customer['email'],
                'name' => [
                    'given_name' => $firstName,
                    'surname' => $lastName,
                ],
            ],
        ],
    ];

    $ch = curl_init(PAYPAL_API_URL . '/v2/checkout/orders');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($paypalOrderBody),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $authToken,
            'Content-Type: application/json',
            'PayPal-Request-Id: ' . $orderNumber, // Idempotency key
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $paypalResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("PayPal cURL error: {$curlError}");
        jsonResponse(['success' => false, 'error' => 'Errore di connessione a PayPal'], 502);
    }

    $paypalData = json_decode($paypalResponse, true);

    if ($httpCode !== 200 && $httpCode !== 201) {
        $ppError = $paypalData['message'] ?? ($paypalData['details'][0]['description'] ?? 'Errore sconosciuto');
        error_log("PayPal API error ({$httpCode}): " . json_encode($paypalData));
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella creazione del pagamento PayPal',
            'detail' => IS_LOCAL ? $ppError : null
        ], 502);
    }

    $paypalOrderId = $paypalData['id'];

    // =====================================================
    // CREA ORDINE NEL DATABASE
    // =====================================================

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                order_number, customer_id, customer_email, customer_name, customer_phone,
                is_guest, status, payment_status,
                requires_invoice, invoice_type, invoice_ragione_sociale, invoice_codice_fiscale,
                invoice_partita_iva, invoice_codice_sdi, invoice_pec,
                billing_address, shipping_address,
                subtotal, shipping_total, tax_total, discount_total, total,
                payment_method, payment_id,
                shipping_method, customer_notes,
                created_at, updated_at
            ) VALUES (
                :order_number, :customer_id, :customer_email, :customer_name, :customer_phone,
                :is_guest, 'pending', 'pending',
                :requires_invoice, :invoice_type, :invoice_ragione_sociale, :invoice_codice_fiscale,
                :invoice_partita_iva, :invoice_codice_sdi, :invoice_pec,
                :billing_address, :shipping_address,
                :subtotal, :shipping_total, :tax_total, :discount_total, :total,
                :payment_method, :payment_id,
                :shipping_method, :customer_notes,
                NOW(3), NOW(3)
            )
        ");

        $stmt->execute([
            'order_number' => $orderNumber,
            'customer_id' => $customerId,
            'customer_email' => $customer['email'],
            'customer_name' => $customer['name'],
            'customer_phone' => $customer['phone'] ?? null,
            'is_guest' => $isGuest ? 1 : 0,
            'requires_invoice' => $requiresInvoice ? 1 : 0,
            'invoice_type' => $requiresInvoice ? ($invoiceData['type'] ?? null) : null,
            'invoice_ragione_sociale' => $requiresInvoice ? ($invoiceData['ragioneSociale'] ?? null) : null,
            'invoice_codice_fiscale' => $requiresInvoice ? ($invoiceData['codiceFiscale'] ?? null) : null,
            'invoice_partita_iva' => $requiresInvoice ? ($invoiceData['partitaIva'] ?? null) : null,
            'invoice_codice_sdi' => $requiresInvoice ? ($invoiceData['codiceSdi'] ?? null) : null,
            'invoice_pec' => $requiresInvoice ? ($invoiceData['pec'] ?? null) : null,
            'billing_address' => json_encode($billingAddress),
            'shipping_address' => json_encode($shippingAddress),
            'subtotal' => $subtotal,
            'shipping_total' => $shippingTotal,
            'tax_total' => $taxTotal,
            'discount_total' => $discountTotal,
            'total' => $total,
            'payment_method' => 'paypal',
            'payment_id' => $paypalOrderId,
            'shipping_method' => $shippingTotal > 0 ? 'standard' : 'gratuita',
            'customer_notes' => $notes ?: null,
        ]);

        $orderId = (int)$pdo->lastInsertId();

        // Inserisci righe ordine
        $itemStmt = $pdo->prepare("
            INSERT INTO order_items (
                order_id, product_id, product_code, product_name,
                variant_sku, variant_name, is_virtual_variant, ordered_size,
                quantity, unit_price, total_price
            ) VALUES (
                :order_id, :product_id, :product_code, :product_name,
                :variant_sku, :variant_name, :is_virtual_variant, :ordered_size,
                :quantity, :unit_price, :total_price
            )
        ");

        foreach ($validatedItems as $vItem) {
            $itemStmt->execute([
                'order_id' => $orderId,
                'product_id' => $vItem['productId'],
                'product_code' => $vItem['productCode'],
                'product_name' => $vItem['productName'],
                'variant_sku' => $vItem['variantSku'],
                'variant_name' => $vItem['variantName'],
                'is_virtual_variant' => $vItem['isVirtualVariant'] ? 1 : 0,
                'ordered_size' => $vItem['orderedSize'],
                'quantity' => $vItem['quantity'],
                'unit_price' => $vItem['unitPrice'],
                'total_price' => $vItem['totalPrice'],
            ]);
        }

        $pdo->commit();

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Errore creazione ordine DB (PayPal): " . $e->getMessage());
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella creazione dell\'ordine',
            'detail' => IS_LOCAL ? $e->getMessage() : null
        ], 500);
    }

    // =====================================================
    // RISPOSTA
    // =====================================================

    jsonResponse([
        'success' => true,
        'paypalOrderId' => $paypalOrderId,
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'totals' => [
            'subtotal' => $subtotal,
            'shipping' => $shippingTotal,
            'tax' => $taxTotal,
            'discount' => $discountTotal,
            'total' => $total,
        ],
    ]);

} catch (Exception $e) {
    error_log('❌ Errore API create-paypal-order: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel processamento dell\'ordine',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}

// =====================================================
// HELPER: Get PayPal Access Token
// =====================================================

function getPayPalAccessToken() {
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
        error_log("PayPal OAuth error ({$httpCode}): {$curlError} - Response: {$response}");
        return null;
    }

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}
