<?php
/**
 * Order Email Helper - Template e invio email ordine
 * 
 * Funzioni:
 * - sendOrderConfirmationEmail() - Email conferma ordine al cliente
 * - sendOrderNotificationEmail() - Notifica nuovo ordine al negozio
 * 
 * NOTA: In locale (IS_LOCAL) le email vengono solo loggate, non inviate.
 * In produzione (Hostinger) usa mail() di PHP.
 */

require_once __DIR__ . '/../config.php';

/**
 * Invia email di conferma ordine al cliente
 * 
 * @param PDO $pdo Database connection
 * @param int $orderId Order ID
 * @return bool Success
 */
function sendOrderConfirmationEmail($pdo, $orderId) {
    try {
        // Fetch complete order data
        $stmt = $pdo->prepare("
            SELECT o.*, 
                   DATE_FORMAT(o.created_at, '%d/%m/%Y alle %H:%i') as formatted_date,
                   DATE_FORMAT(o.paid_at, '%d/%m/%Y alle %H:%i') as formatted_paid_date
            FROM orders o
            WHERE o.id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            error_log("[OrderEmail] Ordine #{$orderId} non trovato");
            return false;
        }

        // Check if email already sent
        if (!empty($order['confirmation_email_sent'])) {
            error_log("[OrderEmail] Email già inviata per ordine {$order['order_number']}");
            return true; // Already sent, consider it success
        }

        // Fetch order items
        $itemStmt = $pdo->prepare("
            SELECT product_code, product_name, variant_name, ordered_size,
                   quantity, unit_price, total_price
            FROM order_items
            WHERE order_id = :order_id
            ORDER BY id ASC
        ");
        $itemStmt->execute(['order_id' => $orderId]);
        $items = $itemStmt->fetchAll();

        // Parse shipping address
        $shippingAddress = json_decode($order['shipping_address'], true) ?? [];

        // Build email
        $subject = "Conferma ordine {$order['order_number']} - Gaurosa Gioielli";
        $htmlBody = buildOrderConfirmationHtml($order, $items, $shippingAddress);

        // Send email
        $sent = sendOrderEmail($order['customer_email'], $subject, $htmlBody);

        if ($sent) {
            // Mark email as sent in DB
            $updateStmt = $pdo->prepare("
                UPDATE orders 
                SET confirmation_email_sent = 1,
                    confirmation_email_sent_at = NOW(3)
                WHERE id = :id
            ");
            $updateStmt->execute(['id' => $orderId]);
            error_log("[OrderEmail] ✅ Email conferma inviata per ordine {$order['order_number']} a {$order['customer_email']}");
        } else {
            error_log("[OrderEmail] ❌ Errore invio email per ordine {$order['order_number']}");
        }

        // Also send notification to shop
        sendOrderNotificationEmail($order, $items, $shippingAddress);

        return $sent;

    } catch (Exception $e) {
        error_log("[OrderEmail] ❌ Eccezione: " . $e->getMessage());
        return false;
    }
}

/**
 * Invia email generica per ordini
 */
function sendOrderEmail($to, $subject, $htmlBody) {
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM . '>',
        'Reply-To: ' . EMAIL_FROM,
        'X-Mailer: PHP/' . phpversion()
    ];

    $isLocal = strpos($_SERVER['HTTP_HOST'] ?? 'localhost', 'localhost') !== false;

    if ($isLocal) {
        // In locale, logga invece di inviare
        error_log("[OrderEmail] 📧 EMAIL TO: {$to}");
        error_log("[OrderEmail] 📧 SUBJECT: {$subject}");
        error_log("[OrderEmail] 📧 BODY LENGTH: " . strlen($htmlBody) . " chars");
        error_log("[OrderEmail] 📧 (Email non inviata - ambiente locale)");
        return true; // Simula successo in locale
    }

    // Produzione - usa mail() di PHP (Hostinger lo configura automaticamente)
    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

/**
 * Invia notifica nuovo ordine al negozio
 */
function sendOrderNotificationEmail($order, $items, $shippingAddress) {
    $shopEmail = EMAIL_FROM; // noreplay@gaurosa.it - o un indirizzo dedicato
    $subject = "🛒 Nuovo ordine {$order['order_number']} - €" . number_format($order['total'], 2, ',', '.');

    $itemsList = '';
    foreach ($items as $item) {
        $variant = $item['variant_name'] ? " ({$item['variant_name']})" : '';
        $size = $item['ordered_size'] ? " - Misura: {$item['ordered_size']}" : '';
        $itemsList .= "- {$item['product_name']}{$variant}{$size} x{$item['quantity']} = €" . number_format($item['total_price'], 2, ',', '.') . "\n";
    }

    $addressStr = ($shippingAddress['firstName'] ?? '') . ' ' . ($shippingAddress['lastName'] ?? '') . "\n"
        . ($shippingAddress['address'] ?? '') . "\n"
        . ($shippingAddress['postalCode'] ?? '') . ' ' . ($shippingAddress['city'] ?? '') . ' (' . ($shippingAddress['province'] ?? '') . ")\n"
        . ($shippingAddress['country'] ?? 'IT');

    $htmlBody = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
        <h2 style='color: #8b1538;'>Nuovo ordine ricevuto!</h2>
        <p><strong>Ordine:</strong> {$order['order_number']}</p>
        <p><strong>Cliente:</strong> {$order['customer_name']} ({$order['customer_email']})</p>
        <p><strong>Telefono:</strong> " . ($order['customer_phone'] ?: 'Non fornito') . "</p>
        <p><strong>Totale:</strong> €" . number_format($order['total'], 2, ',', '.') . "</p>
        <p><strong>Spedizione:</strong> €" . number_format($order['shipping_total'], 2, ',', '.') . "</p>
        <hr>
        <h3>Articoli:</h3>
        <pre>{$itemsList}</pre>
        <hr>
        <h3>Indirizzo spedizione:</h3>
        <pre>{$addressStr}</pre>
        " . ($order['requires_invoice'] ? "<hr><p><strong>⚠️ FATTURA RICHIESTA</strong> - Tipo: {$order['invoice_type']}</p>" : '') . "
        " . ($order['customer_notes'] ? "<hr><p><strong>Note cliente:</strong> {$order['customer_notes']}</p>" : '') . "
    </body>
    </html>";

    sendOrderEmail($shopEmail, $subject, $htmlBody);
}

/**
 * Genera HTML per email conferma ordine al cliente
 */
function buildOrderConfirmationHtml($order, $items, $shippingAddress) {
    $orderNumber = htmlspecialchars($order['order_number']);
    $customerName = htmlspecialchars($order['customer_name']);
    $firstName = htmlspecialchars(explode(' ', $order['customer_name'])[0]);
    $orderDate = $order['formatted_date'] ?? date('d/m/Y', strtotime($order['created_at']));
    
    // Format totals
    $subtotal = number_format($order['subtotal'], 2, ',', '.');
    $shippingTotal = number_format($order['shipping_total'], 2, ',', '.');
    $total = number_format($order['total'], 2, ',', '.');
    $isFreeShipping = (float)$order['shipping_total'] === 0.0;

    // Build items HTML
    $itemsHtml = '';
    foreach ($items as $item) {
        $productName = htmlspecialchars($item['product_name']);
        $variantInfo = '';
        if ($item['variant_name']) {
            $variantInfo = '<span style="color: #888; font-size: 13px;"> - ' . htmlspecialchars($item['variant_name']) . '</span>';
        }
        $sizeInfo = '';
        if ($item['ordered_size']) {
            $sizeInfo = '<br><span style="color: #888; font-size: 13px;">Misura: ' . htmlspecialchars($item['ordered_size']) . '</span>';
        }
        $qty = (int)$item['quantity'];
        $unitPrice = number_format($item['unit_price'], 2, ',', '.');
        $lineTotal = number_format($item['total_price'], 2, ',', '.');

        $itemsHtml .= "
        <tr>
            <td style='padding: 14px 16px; border-bottom: 1px solid #f0f0f0;'>
                <strong style='color: #333;'>{$productName}</strong>{$variantInfo}{$sizeInfo}
            </td>
            <td style='padding: 14px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666;'>
                {$qty}
            </td>
            <td style='padding: 14px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #666;'>
                €{$unitPrice}
            </td>
            <td style='padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #333;'>
                €{$lineTotal}
            </td>
        </tr>";
    }

    // Shipping address
    $addrName = htmlspecialchars(($shippingAddress['firstName'] ?? '') . ' ' . ($shippingAddress['lastName'] ?? ''));
    $addrLine = htmlspecialchars($shippingAddress['address'] ?? '');
    $addrCity = htmlspecialchars(($shippingAddress['postalCode'] ?? '') . ' ' . ($shippingAddress['city'] ?? '') . ' (' . ($shippingAddress['province'] ?? '') . ')');
    $addrCountry = htmlspecialchars($shippingAddress['country'] ?? 'Italia');

    // Shipping label
    $shippingLabel = $isFreeShipping 
        ? '<span style="color: #16a34a; font-weight: bold;">GRATUITA</span>' 
        : "€{$shippingTotal}";

    // Site URL for links
    $siteUrl = SITE_URL;

    return '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma Ordine ' . $orderNumber . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #333;">
    
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 30px 15px;">
                
                <!-- Main Container -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b1538 0%, #6b1028 100%); padding: 35px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">GAUROSA</h1>
                            <p style="margin: 5px 0 0; color: #f9c3d5; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Gioielli Artigianali</p>
                        </td>
                    </tr>

                    <!-- Success Banner -->
                    <tr>
                        <td style="padding: 35px 30px 20px; text-align: center;">
                            <div style="width: 70px; height: 70px; margin: 0 auto 20px; background-color: #dcfce7; border-radius: 50%; line-height: 70px; font-size: 36px;">
                                ✓
                            </div>
                            <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                Ordine confermato!
                            </h2>
                            <p style="margin: 0; color: #666; font-size: 16px;">
                                Ciao <strong>' . $firstName . '</strong>, grazie per il tuo acquisto!
                            </p>
                        </td>
                    </tr>

                    <!-- Order Number Box -->
                    <tr>
                        <td style="padding: 0 30px 25px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; border-radius: 10px; border: 1px solid #f9c3d5;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="margin: 0 0 5px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Numero ordine</p>
                                        <p style="margin: 0; color: #8b1538; font-size: 22px; font-weight: bold; letter-spacing: 1px;">' . $orderNumber . '</p>
                                        <p style="margin: 8px 0 0; color: #999; font-size: 13px;">' . $orderDate . '</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Items Table -->
                    <tr>
                        <td style="padding: 0 30px 25px;">
                            <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                Riepilogo ordine
                            </h3>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                                <!-- Table Header -->
                                <tr style="background-color: #fafafa;">
                                    <td style="padding: 12px 16px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Articolo</td>
                                    <td style="padding: 12px 12px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">Qtà</td>
                                    <td style="padding: 12px 12px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: right;">Prezzo</td>
                                    <td style="padding: 12px 16px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: right;">Totale</td>
                                </tr>
                                ' . $itemsHtml . '
                            </table>
                        </td>
                    </tr>

                    <!-- Totals -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Subtotale</td>
                                    <td style="padding: 8px 0; text-align: right; color: #333;">€' . $subtotal . '</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Spedizione</td>
                                    <td style="padding: 8px 0; text-align: right;">' . $shippingLabel . '</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="border-top: 2px solid #8b1538; padding-top: 12px;"></td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">Totale</td>
                                    <td style="padding: 4px 0; text-align: right; color: #8b1538; font-size: 22px; font-weight: bold;">€' . $total . '</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 4px 0; color: #999; font-size: 12px;">IVA inclusa</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Shipping Address -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 10px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                            📦 Indirizzo di spedizione
                                        </h3>
                                        <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
                                            <strong>' . $addrName . '</strong><br>
                                            ' . $addrLine . '<br>
                                            ' . $addrCity . '<br>
                                            ' . $addrCountry . '
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Next Steps -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Prossimi passi</h3>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; vertical-align: top; width: 35px;">
                                        <span style="display: inline-block; width: 28px; height: 28px; background-color: #8b1538; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: bold;">1</span>
                                    </td>
                                    <td style="padding: 10px 0 10px 10px; color: #555; font-size: 14px;">
                                        <strong>Preparazione</strong> — Il tuo ordine verrà preparato con cura entro 1-2 giorni lavorativi.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; vertical-align: top; width: 35px;">
                                        <span style="display: inline-block; width: 28px; height: 28px; background-color: #8b1538; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: bold;">2</span>
                                    </td>
                                    <td style="padding: 10px 0 10px 10px; color: #555; font-size: 14px;">
                                        <strong>Spedizione</strong> — Riceverai un\'email con il codice di tracciamento non appena il pacco sarà affidato al corriere.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; vertical-align: top; width: 35px;">
                                        <span style="display: inline-block; width: 28px; height: 28px; background-color: #8b1538; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: bold;">3</span>
                                    </td>
                                    <td style="padding: 10px 0 10px 10px; color: #555; font-size: 14px;">
                                        <strong>Consegna</strong> — Il pacco arriverà in 2-4 giorni lavorativi dalla spedizione.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 35px; text-align: center;">
                            <a href="' . $siteUrl . '/prodotti" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b1538 0%, #6b1028 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
                                Continua lo shopping
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 25px 30px; border-top: 1px solid #eee;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 8px; color: #8b1538; font-size: 16px; font-weight: 600; letter-spacing: 2px;">GAUROSA</p>
                                        <p style="margin: 0 0 12px; color: #999; font-size: 12px;">Gioielli Artigianali dal cuore di Padova</p>
                                        <p style="margin: 0 0 5px; color: #999; font-size: 12px;">
                                            Hai bisogno di aiuto? Scrivici a 
                                            <a href="mailto:info@gaurosa.it" style="color: #8b1538; text-decoration: none;">info@gaurosa.it</a>
                                        </p>
                                        <p style="margin: 0; color: #ccc; font-size: 11px; padding-top: 12px;">
                                            © ' . date('Y') . ' Gaurosa Gioielli. Tutti i diritti riservati.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->

            </td>
        </tr>
    </table>
    <!-- End Wrapper -->

</body>
</html>';
}
