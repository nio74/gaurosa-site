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

    $subtotal = round($subtotal, 2);
    $shippingTotal = $subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : SHIPPING_COST;
    $totalBeforeTax = $subtotal + $shippingTotal;
    $taxTotal = round($totalBeforeTax * 22 / 122, 2);
    $discountTotal = 0.00;
    $total = round($subtotal + $shippingTotal, 2);

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
        error_log("Errore creazione ordine DB (bonifico): " . $e->getMessage());
        jsonResponse([
            'success' => false, 
            'error' => 'Errore nella creazione dell\'ordine',
            'detail' => IS_LOCAL ? $e->getMessage() : null
        ], 500);
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
    
    // Send email (uses same logic as order-email.php)
    if (IS_LOCAL) {
        error_log("[BankTransfer] 📧 Email bonifico (locale, non inviata): To={$customer['email']}, Subject={$subject}");
        
        // Mark as sent in DB
        $updateStmt = $pdo->prepare("
            UPDATE orders SET confirmation_email_sent = 1, confirmation_email_sent_at = NOW(3) WHERE id = :id
        ");
        $updateStmt->execute(['id' => $orderId]);
        return;
    }
    
    // Production: send via PHP mail()
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM . ">\r\n";
    $headers .= "Reply-To: info@gaurosa.it\r\n";
    
    $sent = mail($customer['email'], $subject, $html, $headers);
    
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
