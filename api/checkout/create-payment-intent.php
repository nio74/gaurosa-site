<?php
/**
 * Crea Payment Intent Stripe e ordine pendente
 * 
 * POST /api/checkout/create-payment-intent
 * 
 * Body JSON:
 * {
 *   items: [{productCode, variantSku, quantity, unitPrice, name, productId, variantName, isVirtualVariant, orderedSize}],
 *   customer: {email, name, phone},
 *   shippingAddress: {firstName, lastName, address, city, province, postalCode, country},
 *   billingAddress: {firstName, lastName, address, city, province, postalCode, country} | null (= uguale a spedizione),
 *   requiresInvoice: bool,
 *   invoiceData: {type, ragioneSociale, codiceFiscale, partitaIva, codiceSdi, pec} | null,
 *   notes: string | null,
 *   paymentMethod: 'card' | 'klarna'
 * }
 * 
 * Returns: {success, clientSecret, orderId, orderNumber, totals}
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
// VALIDAZIONE INPUT
// =====================================================

$items = $body['items'] ?? [];
$customer = $body['customer'] ?? [];
$shippingAddress = $body['shippingAddress'] ?? null;
$billingAddress = $body['billingAddress'] ?? null;
$requiresInvoice = (bool)($body['requiresInvoice'] ?? false);
$invoiceData = $body['invoiceData'] ?? null;
$notes = trim($body['notes'] ?? '');
$paymentMethod = $body['paymentMethod'] ?? 'card';

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
        // Fattura privato
        if (empty($invoiceData['codiceFiscale'])) {
            jsonResponse(['success' => false, 'error' => 'Codice fiscale obbligatorio per fattura privato'], 400);
        }
    }
}

// Validazione metodo pagamento
$allowedPaymentMethods = ['card', 'klarna'];
if (!in_array($paymentMethod, $allowedPaymentMethods)) {
    jsonResponse(['success' => false, 'error' => 'Metodo di pagamento non supportato'], 400);
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
            // Prodotto con variante - controlla prezzo variante
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
            // Prodotto senza variante
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

        // Prezzo reale dal DB (variante ha priorità se presente)
        $dbPrice = $dbProduct['variant_price'] !== null 
            ? round((float)$dbProduct['variant_price'], 2) 
            : round((float)$dbProduct['product_price'], 2);

        // Controlla che il prezzo client corrisponda al prezzo DB (tolleranza 0.01)
        if (abs($clientUnitPrice - $dbPrice) > 0.01) {
            jsonResponse([
                'success' => false, 
                'error' => "Il prezzo di '{$item['name']}' è cambiato. Aggiorna il carrello.",
                'detail' => IS_LOCAL ? "Client: {$clientUnitPrice}, DB: {$dbPrice}" : null
            ], 409);
        }

        // Controlla stock
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

    // =====================================================
    // VALIDAZIONE COUPON SERVER-SIDE
    // =====================================================
    $couponCode = strtoupper(trim($body['coupon_code'] ?? ''));
    $discountTotal = 0.00;
    $appliedCouponId = null;

    if ($couponCode !== '') {
        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("
            SELECT * FROM promotions
            WHERE coupon_code = :code
              AND type = 'coupon'
              AND is_active = 1
              AND starts_at <= :now
              AND ends_at >= :now
            LIMIT 1
        ");
        $stmt->execute([':code' => $couponCode, ':now' => $now]);
        $couponPromo = $stmt->fetch();

        if (!$couponPromo) {
            jsonResponse(['success' => false, 'error' => 'Codice coupon non valido o scaduto'], 400);
        }

        // Verifica limite utilizzi totali
        if ($couponPromo['max_uses'] !== null && (int)$couponPromo['times_used'] >= (int)$couponPromo['max_uses']) {
            jsonResponse(['success' => false, 'error' => 'Questo coupon ha raggiunto il limite massimo di utilizzi'], 400);
        }

        // Calcola sconto coupon
        if ($couponPromo['discount_type'] === 'percentage') {
            $discountTotal = round($subtotal * ((float)$couponPromo['discount_value'] / 100), 2);
        } else {
            $discountTotal = min((float)$couponPromo['discount_value'], $subtotal);
        }

        $appliedCouponId = (int)$couponPromo['id'];
    }

    // Subtotale dopo sconto
    $discountedSubtotal = max(0, $subtotal - $discountTotal);

    // Calcolo spedizione (basata sul subtotale scontato)
    $shippingTotal = $discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : SHIPPING_COST;

    // IVA inclusa nei prezzi (22%) - calcoliamo la quota IVA per trasparenza
    // taxTotal = totale * 22 / 122 (scorporo IVA)
    $totalBeforeTax = $discountedSubtotal + $shippingTotal;
    $taxTotal = round($totalBeforeTax * 22 / 122, 2);

    $total = round($discountedSubtotal + $shippingTotal, 2);

    // Stripe vuole importo in centesimi
    $amountCents = (int)round($total * 100);

    if ($amountCents < 50) {
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
        // Utente autenticato - cerca il customer nel DB
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $authUser['id']]);
        $dbCustomer = $stmt->fetch();
        if ($dbCustomer) {
            $customerId = (int)$dbCustomer['id'];
            $isGuest = false;
        }
    }

    // =====================================================
    // CREA PAYMENT INTENT SU STRIPE (cURL)
    // =====================================================

    $stripePaymentMethodTypes = ['card'];
    if ($paymentMethod === 'klarna') {
        $stripePaymentMethodTypes = ['klarna'];
    }

    $stripeBody = [
        'amount' => $amountCents,
        'currency' => 'eur',
        'metadata[order_number]' => $orderNumber,
        'metadata[customer_email]' => $customer['email'],
        'metadata[customer_name]' => $customer['name'],
        'receipt_email' => $customer['email'],
        'description' => "Ordine {$orderNumber} - Gaurosa Gioielli",
    ];

    // Aggiungi payment method types
    foreach ($stripePaymentMethodTypes as $idx => $type) {
        $stripeBody["payment_method_types[{$idx}]"] = $type;
    }

    $ch = curl_init('https://api.stripe.com/v1/payment_intents');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($stripeBody),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . STRIPE_SECRET_KEY,
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $stripeResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("Stripe cURL error: {$curlError}");
        jsonResponse(['success' => false, 'error' => 'Errore di connessione al sistema di pagamento'], 502);
    }

    $stripeData = json_decode($stripeResponse, true);

    if ($httpCode !== 200 || !isset($stripeData['client_secret'])) {
        $stripeError = $stripeData['error']['message'] ?? 'Errore sconosciuto';
        error_log("Stripe API error ({$httpCode}): {$stripeError}");
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella creazione del pagamento',
            'detail' => IS_LOCAL ? $stripeError : null
        ], 502);
    }

    $paymentIntentId = $stripeData['id'];
    $clientSecret = $stripeData['client_secret'];

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
            'payment_method' => $paymentMethod === 'klarna' ? 'klarna' : 'stripe',
            'payment_id' => $paymentIntentId,
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

        // Incrementa contatore utilizzi coupon (se applicato)
        if ($appliedCouponId !== null) {
            try {
                $pdo->prepare("UPDATE promotions SET times_used = times_used + 1 WHERE id = :id")
                    ->execute([':id' => $appliedCouponId]);
            } catch (Exception $couponEx) {
                error_log("Warning: impossibile aggiornare times_used coupon #{$appliedCouponId}: " . $couponEx->getMessage());
            }
        }

    } catch (Exception $e) {
        $pdo->rollBack();

        // Cancella il Payment Intent su Stripe dato che l'ordine non è stato creato
        $cancelCh = curl_init("https://api.stripe.com/v1/payment_intents/{$paymentIntentId}/cancel");
        curl_setopt_array($cancelCh, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . STRIPE_SECRET_KEY,
            ],
            CURLOPT_TIMEOUT => 10,
        ]);
        curl_exec($cancelCh);
        curl_close($cancelCh);

        error_log("Errore creazione ordine DB: " . $e->getMessage());
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
        'clientSecret' => $clientSecret,
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
    error_log('❌ Errore API create-payment-intent: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel processamento dell\'ordine',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}
