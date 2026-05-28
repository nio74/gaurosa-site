<?php
/**
 * Crea ordine con pagamento tramite bonifico bancario
 * 
 * POST /api/checkout/create-bank-transfer-order
 * 
 * Body JSON: same as create-payment-intent.php but paymentMethod = 'bank_transfer'
 * 
 * Returns: {success, orderId, orderNumber, totals, bankDetails}
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/jwt.php';
require_once __DIR__ . '/order-email.php';
require_once __DIR__ . '/stock-helpers.php';
require_once __DIR__ . '/../lib/mazgest-sync.php';

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
// Coupon code applicato (validato server-side)
// Accetta sia camelCase (couponCode dal frontend) che snake_case (coupon_code legacy)
$couponCodeRaw = $body['couponCode'] ?? $body['coupon_code'] ?? null;
$couponCode = !empty($couponCodeRaw) ? strtoupper(trim($couponCodeRaw)) : null;
// Consenso marketing per sync verso Brevo (default false se non passato)
$marketingConsent = (bool)($body['marketingConsent'] ?? false);

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

    $subtotal = 0;
    $validatedItems = [];

    foreach ($items as $item) {
        $productCode = $item['productCode'];
        $variantSku = $item['variantSku'] ?? null;
        $quantity = (int)$item['quantity'];
        $clientUnitPrice = round((float)$item['unitPrice'], 2);

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

    // Stock check AGGREGATO per prodotto: per varianti virtuali (misure anello) il check
    // riga-per-riga su variant.stock non e' sufficiente perche' tutte le varianti virtuali
    // dello stesso prodotto attingono dallo stesso stock fisico (products.stock).
    validateAggregateProductStock($pdo, $validatedItems);

    $subtotal = round($subtotal, 2);
    $shippingTotal = $subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : SHIPPING_COST;

    // =====================================================
    // VALIDAZIONE E APPLICAZIONE COUPON CODE
    // =====================================================
    // Se l'utente fornisce un couponCode ma è invalido, blocchiamo l'ordine con errore esplicito.
    // Senza questa logica il sistema applicherebbe €0 di sconto silenziosamente facendo pagare
    // al cliente il prezzo pieno senza che lui se ne accorga (UX rotta).
    $discountTotal = 0.00;
    $couponPromotionId = null;
    $couponAppliedCode = null;
    $couponError = null; // Se != null e couponCode fornito, blocchiamo con 400

    if ($couponCode) {
        $stmt = $pdo->prepare("
            SELECT id, name, type, discount_type, discount_value,
                   coupon_code, max_uses, max_uses_per_user, times_used,
                   starts_at, ends_at, is_active
            FROM promotions
            WHERE coupon_code = :code AND is_active = 1
            LIMIT 1
        ");
        $stmt->execute(['code' => $couponCode]);
        $promo = $stmt->fetch();

        $now = date('Y-m-d H:i:s');

        if (!$promo) {
            $couponError = "Il codice sconto '{$couponCode}' non è valido o è stato disattivato";
        } elseif ($promo['starts_at'] > $now || $promo['ends_at'] < $now) {
            $couponError = "Il codice sconto '{$couponCode}' è scaduto o non ancora valido";
        } elseif ($promo['max_uses'] !== null && (int)$promo['times_used'] >= (int)$promo['max_uses']) {
            $couponError = "Il codice sconto '{$couponCode}' ha raggiunto il limite massimo di utilizzi";
        } else {
            // Verifica max_uses_per_user (basato su email cliente)
            $perUserLimit = (int)($promo['max_uses_per_user'] ?? 0);
            if ($perUserLimit > 0) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as used_count
                    FROM orders
                    WHERE customer_email = :email
                      AND customer_notes LIKE :coupon_marker
                      AND status NOT IN ('cancelled', 'refunded')
                ");
                $stmt->execute([
                    'email' => strtolower($customer['email']),
                    'coupon_marker' => '[COUPON:' . $couponCode . ']%',
                ]);
                $usedByUser = (int)$stmt->fetch()['used_count'];
                if ($usedByUser >= $perUserLimit) {
                    $couponError = "Hai già usato il codice '{$couponCode}'. Questo codice è valido una sola volta per cliente";
                }
            }

            if (!$couponError) {
                if ($promo['discount_type'] === 'percentage') {
                    $discountTotal = round($subtotal * ((float)$promo['discount_value']) / 100, 2);
                } else { // fixed_amount
                    $discountTotal = min(round((float)$promo['discount_value'], 2), $subtotal);
                }
                if ($discountTotal > $subtotal) {
                    $discountTotal = $subtotal;
                }
                $couponPromotionId = (int)$promo['id'];
                $couponAppliedCode = $couponCode;
                error_log("[BankTransfer] ✅ Coupon '{$couponCode}' applicato: -€{$discountTotal} (subtotal €{$subtotal})");
            }
        }

        // Se c'è errore sul coupon: blocca con 400 STRUTTURATO (frontend mostrerà alert)
        if ($couponError) {
            error_log("[BankTransfer] ❌ Coupon '{$couponCode}' rifiutato: {$couponError}");
            jsonResponse([
                'success' => false,
                'error' => $couponError,
                'couponInvalid' => true,
                'couponCode' => $couponCode,
            ], 400);
        }
    }

    $total = round($subtotal + $shippingTotal - $discountTotal, 2);
    if ($total < 0) $total = 0.00;
    $taxTotal = round($total * 22 / 122, 2);

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

    // Guest checkout: cerca o crea customer record (senza password) per consolidare anagrafica
    // così abbiamo storico ordini per email + sync verso MazGest anche per non registrati
    if (!$customerId) {
        $emailLower = strtolower(trim($customer['email']));
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $emailLower]);
        $existingByEmail = $stmt->fetch();

        if ($existingByEmail) {
            // Customer già esiste con questa email (es. iscritto newsletter o guest precedente)
            $customerId = (int)$existingByEmail['id'];
        } else {
            // Crea nuovo customer SENZA password (potential customer)
            $nameParts = explode(' ', trim($customer['name']), 2);
            $firstName = $nameParts[0] ?? null;
            $lastName = $nameParts[1] ?? null;

            $createStmt = $pdo->prepare("
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
                    :marketing_consent, :consented_at,
                    'email', 'pending',
                    NOW(3), NOW(3)
                )
            ");
            $createStmt->execute([
                'email' => $emailLower,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => $customer['phone'] ?? null,
                'b_address' => $billingAddress['address'] ?? null,
                'b_city' => $billingAddress['city'] ?? null,
                'b_province' => $billingAddress['province'] ?? null,
                'b_postcode' => $billingAddress['postalCode'] ?? null,
                'b_country' => substr($billingAddress['country'] ?? 'IT', 0, 2),
                's_address' => $shippingAddress['address'] ?? null,
                's_city' => $shippingAddress['city'] ?? null,
                's_province' => $shippingAddress['province'] ?? null,
                's_postcode' => $shippingAddress['postalCode'] ?? null,
                's_country' => substr($shippingAddress['country'] ?? 'IT', 0, 2),
                'marketing_consent' => $marketingConsent ? 1 : 0,
                'consented_at' => $marketingConsent ? date('Y-m-d H:i:s.u') : null,
            ]);
            $customerId = (int)$pdo->lastInsertId();
            error_log("[BankTransfer] ✨ Creato customer guest #{$customerId} per email {$emailLower}");
        }
        // is_guest resta true per questo ordine (cliente senza password)
    }

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
                :is_guest, 'pending', 'awaiting_payment',
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
            'payment_method' => 'bank_transfer',
            'payment_id' => 'BT-' . $orderNumber, // Reference for bank transfer
            'shipping_method' => $shippingTotal > 0 ? 'standard' : 'gratuita',
            // Prefisso coupon nelle note per tracciabilità (no schema change necessario)
            'customer_notes' => $couponAppliedCode
                ? '[COUPON:' . $couponAppliedCode . '] ' . ($notes ?: '')
                : ($notes ?: null),
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

        // Incrementa times_used del coupon (dentro la stessa transazione per consistency)
        if ($couponPromotionId) {
            $stmt = $pdo->prepare("UPDATE promotions SET times_used = times_used + 1 WHERE id = :id");
            $stmt->execute(['id' => $couponPromotionId]);
        }

        $pdo->commit();

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Errore creazione ordine DB (bonifico): " . $e->getMessage());
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella creazione dell\'ordine',
            'detail' => IS_LOCAL ? $e->getMessage() : null
        ], 500);
    }

    // =====================================================
    // DECREMENTO STOCK (PRENOTAZIONE)
    // =====================================================
    // Per il bonifico decrementiamo subito al checkout per "prenotare" lo stock,
    // altrimenti il prodotto resterebbe acquistabile da altri clienti per ore/giorni
    // mentre attendiamo l'arrivo del bonifico in banca. La funzione è idempotente:
    // quando MazGest poi chiamerà update-order-status.php con paymentStatus=paid,
    // il campo orders.stock_deducted_at impedirà un secondo decremento.
    try {
        $stockResult = deductOrderStock($pdo, $orderId);
        error_log("[BankTransfer] Stock decrementato per ordine {$orderNumber}: " .
            "{$stockResult['deducted']} articoli" .
            ($stockResult['skipped'] ? ' (skipped: già decrementato)' : ''));
    } catch (Exception $stockErr) {
        error_log("[BankTransfer] ⚠️ Errore decremento stock (non bloccante): " . $stockErr->getMessage());
    }

    // =====================================================
    // SYNC CUSTOMER VERSO MAZGEST (anche per guest)
    // =====================================================

    if ($customerId) {
        try {
            $syncOk = syncCustomerToMazGest($customerId);
            error_log("[BankTransfer] MazGest sync customer #{$customerId}: " . ($syncOk ? 'OK' : 'FAILED'));
        } catch (Exception $syncErr) {
            error_log("[BankTransfer] ⚠️ Errore sync MazGest (non bloccante): " . $syncErr->getMessage());
        }
    }

    // =====================================================
    // INVIA EMAIL CON ISTRUZIONI BONIFICO
    // =====================================================

    try {
        sendBankTransferEmail($pdo, $orderId, $orderNumber, $total, $customer);
    } catch (Exception $emailError) {
        error_log("[BankTransfer] ⚠️ Errore invio email (non bloccante): " . $emailError->getMessage());
    }

    // =====================================================
    // RISPOSTA CON COORDINATE BANCARIE
    // =====================================================

    jsonResponse([
        'success' => true,
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'totals' => [
            'subtotal' => $subtotal,
            'shipping' => $shippingTotal,
            'tax' => $taxTotal,
            'discount' => $discountTotal,
            'total' => $total,
        ],
        'bankDetails' => [
            'accountHolder' => BANK_ACCOUNT_HOLDER,
            'iban' => BANK_IBAN,
            'bankName' => BANK_NAME,
            'branch' => BANK_BRANCH,
            'swift' => BANK_SWIFT,
            'reference' => $orderNumber,
            'amount' => number_format($total, 2, ',', '.'),
        ],
    ]);

} catch (Exception $e) {
    error_log('❌ Errore API create-bank-transfer-order: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel processamento dell\'ordine',
        'detail' => IS_LOCAL ? $e->getMessage() : null,
    ], 500);
}

// =====================================================
// HELPER: Send bank transfer instructions email
// =====================================================

function sendBankTransferEmail($pdo, $orderId, $orderNumber, $total, $customer) {
    // Robustezza: in dev se Mailpit non risponde il timeout di mail() puo' bloccare
    // l'intera response del checkout. Riduco il timeout di connessione socket a 1s
    // (default 60s) cosi' al massimo si perdono 2 secondi (2 mail × 1s).
    @ini_set('default_socket_timeout', '1');

    $formattedTotal = number_format($total, 2, ',', '.');
    
    $subject = "Ordine {$orderNumber} - Istruzioni per il bonifico bancario";
    
    $html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">';
    $html .= '<div style="max-width:600px;margin:0 auto;background:#ffffff;">';
    
    // Header
    $html .= '<div style="background:#8b1538;padding:30px;text-align:center;">';
    $html .= '<h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">GAUROSA</h1>';
    $html .= '<p style="color:#f9c3d5;margin:8px 0 0;font-size:14px;">Gioielli Artigianali</p>';
    $html .= '</div>';
    
    // Content
    $html .= '<div style="padding:30px;">';
    $html .= "<h2 style='color:#333;margin:0 0 10px;'>Grazie per il tuo ordine!</h2>";
    $html .= "<p style='color:#666;line-height:1.6;'>Ciao <strong>{$customer['name']}</strong>,</p>";
    $html .= "<p style='color:#666;line-height:1.6;'>Il tuo ordine <strong style='color:#8b1538;'>{$orderNumber}</strong> è stato registrato. Per completare l'acquisto, effettua un bonifico bancario con i seguenti dati:</p>";
    
    // Bank details box
    $html .= '<div style="background:#f8f4f0;border:2px solid #8b1538;border-radius:8px;padding:20px;margin:20px 0;">';
    $html .= '<h3 style="color:#8b1538;margin:0 0 15px;font-size:16px;">Coordinate Bancarie</h3>';
    $html .= '<table style="width:100%;border-collapse:collapse;">';
    $html .= '<tr><td style="padding:6px 0;color:#666;width:130px;">Intestatario:</td><td style="padding:6px 0;color:#333;font-weight:bold;">' . BANK_ACCOUNT_HOLDER . '</td></tr>';
    $html .= '<tr><td style="padding:6px 0;color:#666;">IBAN:</td><td style="padding:6px 0;color:#333;font-weight:bold;font-family:monospace;font-size:15px;">' . BANK_IBAN . '</td></tr>';
    $html .= '<tr><td style="padding:6px 0;color:#666;">Banca:</td><td style="padding:6px 0;color:#333;">' . BANK_NAME . '</td></tr>';
    $html .= '<tr><td style="padding:6px 0;color:#666;">Filiale:</td><td style="padding:6px 0;color:#333;">' . BANK_BRANCH . '</td></tr>';
    $html .= '<tr><td style="padding:6px 0;color:#666;">BIC/SWIFT:</td><td style="padding:6px 0;color:#333;font-family:monospace;">' . BANK_SWIFT . '</td></tr>';
    $html .= '<tr><td colspan="2" style="padding:12px 0 6px;border-top:1px solid #ddd;"></td></tr>';
    $html .= "<tr><td style='padding:6px 0;color:#666;'>Importo:</td><td style='padding:6px 0;color:#8b1538;font-weight:bold;font-size:18px;'>€ {$formattedTotal}</td></tr>";
    $html .= "<tr><td style='padding:6px 0;color:#666;'>Causale:</td><td style='padding:6px 0;color:#333;font-weight:bold;'>{$orderNumber}</td></tr>";
    $html .= '</table>';
    $html .= '</div>';
    
    // Important note
    $html .= '<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:15px;margin:20px 0;">';
    $html .= '<p style="color:#856404;margin:0;font-size:14px;"><strong>⚠️ Importante:</strong> Indica il numero ordine <strong>' . $orderNumber . '</strong> nella causale del bonifico per permetterci di identificare il pagamento.</p>';
    $html .= '</div>';
    
    $html .= '<p style="color:#666;line-height:1.6;">Una volta ricevuto il pagamento (generalmente entro 1-2 giorni lavorativi), procederemo con la preparazione e spedizione del tuo ordine.</p>';
    $html .= '<p style="color:#666;line-height:1.6;">Riceverai una email di conferma quando il pagamento sarà verificato.</p>';
    
    $html .= '</div>';
    
    // Footer
    $html .= '<div style="background:#f5f5f5;padding:20px;text-align:center;border-top:1px solid #eee;">';
    $html .= '<p style="color:#999;font-size:12px;margin:0;">Gaurosa Gioielli - Via Don G. Carrara, 19 - 35010 Villa del Conte (PD)</p>';
    $html .= '<p style="color:#999;font-size:12px;margin:5px 0 0;">Per assistenza: <a href="mailto:info@gaurosa.it" style="color:#8b1538;">info@gaurosa.it</a></p>';
    $html .= '</div>';
    
    $html .= '</div></body></html>';
    
    // Send email via PHP mail()
    // In dev: php.ini punta a Mailpit (localhost:1025) -> email visibili su http://localhost:8025
    // In prod (Hostinger): mail() usa il sendmail di sistema
    error_log("[BankTransfer] 📧 [" . gaurosaEnv() . "] Invio email bonifico To={$customer['email']}, Subject={$subject}");

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    $headers .= "Reply-To: info@gaurosa.it\r\n";

    $sent = @mail($customer['email'], $subject, $html, $headers);
    if (!$sent) {
        error_log("[BankTransfer] ❌ mail() ha restituito false per {$customer['email']}");
    }
    
    if ($sent) {
        $updateStmt = $pdo->prepare("
            UPDATE orders SET confirmation_email_sent = 1, confirmation_email_sent_at = NOW(3) WHERE id = :id
        ");
        $updateStmt->execute(['id' => $orderId]);
    }
    
    // Also notify shop
    $shopSubject = "Nuovo ordine bonifico: {$orderNumber} - € {$formattedTotal}";
    $shopBody = "Nuovo ordine con pagamento tramite bonifico bancario.\n\n";
    $shopBody .= "Ordine: {$orderNumber}\n";
    $shopBody .= "Cliente: {$customer['name']} ({$customer['email']})\n";
    $shopBody .= "Totale: € {$formattedTotal}\n\n";
    $shopBody .= "Il pagamento è in attesa di bonifico. Verificare l'accredito sul conto corrente.";
    
    $shopHeaders = "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    mail(EMAIL_FROM, $shopSubject, $shopBody, $shopHeaders);
}
