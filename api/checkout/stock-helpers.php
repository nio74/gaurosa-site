<?php
/**
 * Stock deduction helpers for gaurosa.it checkout
 *
 * Deducts stock from products/variants after a successful payment.
 * Used by: confirm-order.php (Stripe), capture-paypal-order.php (PayPal),
 *          update-order-status.php (bank transfer confirmation from MazGest)
 */

/**
 * Validazione stock AGGREGATA per product_id.
 *
 * Necessaria per i prodotti con varianti virtuali (es. anelli con misure):
 * tutte le misure virtuali attingono dallo stesso stock fisico (products.stock),
 * quindi il check riga-per-riga su variant.stock non basta a prevenire overselling
 * quando il cliente mette nel carrello piu' misure dello stesso anello.
 *
 * Strategia: raggruppa $validatedItems per productId, somma le quantita',
 * confronta con products.stock (lo stock complessivo del prodotto).
 *
 * In caso di overselling, chiama jsonResponse(...) con HTTP 409 e termina.
 *
 * @param PDO   $pdo
 * @param array $validatedItems  Array di item con almeno: productId, productName, quantity
 */
function validateAggregateProductStock(PDO $pdo, array $validatedItems): void {
    // Raggruppa per product_id
    $byProduct = [];
    foreach ($validatedItems as $vi) {
        $pid = (int)$vi['productId'];
        if (!isset($byProduct[$pid])) {
            $byProduct[$pid] = [
                'name' => $vi['productName'] ?? "Prodotto #{$pid}",
                'quantity' => 0,
            ];
        }
        $byProduct[$pid]['quantity'] += (int)$vi['quantity'];
    }

    if (empty($byProduct)) return;

    // Una sola query per tutti i product_id coinvolti
    $ids = array_keys($byProduct);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, stock FROM products WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $stockMap = [];
    foreach ($stmt->fetchAll() as $row) {
        $stockMap[(int)$row['id']] = (int)$row['stock'];
    }

    foreach ($byProduct as $pid => $data) {
        $available = $stockMap[$pid] ?? 0;
        if ($data['quantity'] > $available) {
            $stockMsg = $available === 0
                ? "'{$data['name']}' non e' piu' disponibile"
                : "'{$data['name']}': disponibili solo {$available} pezzi in totale (hai richiesto {$data['quantity']} sommando tutte le misure scelte). Riduci la quantita' o rimuovi alcune misure dal carrello.";
            jsonResponse(['success' => false, 'error' => $stockMsg], 409);
        }
    }
}

/**
 * Deduct stock for all items in an order.
 *
 * Idempotent: il primo caller a passare imposta orders.stock_deducted_at; i caller
 * successivi (es. webhook che arriva dopo confirm-order, oppure update-order-status
 * dopo che il bonifico ha già decrementato al checkout) ritornano early con
 * skipped=true senza toccare lo stock.
 *
 * @param PDO $pdo Database connection
 * @param int $orderId The order ID
 * @return array Results with deducted items and any warnings
 */
function deductOrderStock($pdo, $orderId) {
    $results = [
        'deducted' => 0,
        'skipped' => false,
        'warnings' => [],
        'details' => [],
    ];

    // Idempotency: skip se già decrementato da un altro flusso
    $checkStmt = $pdo->prepare("SELECT stock_deducted_at FROM orders WHERE id = :id LIMIT 1");
    $checkStmt->execute(['id' => $orderId]);
    $orderRow = $checkStmt->fetch();
    if (!$orderRow) {
        $results['warnings'][] = "Ordine #{$orderId} non trovato";
        return $results;
    }
    if (!empty($orderRow['stock_deducted_at'])) {
        $results['skipped'] = true;
        error_log("[Stock] ⏭ Ordine #{$orderId} già decrementato il {$orderRow['stock_deducted_at']} - skip");
        return $results;
    }

    // Fetch order items
    $stmt = $pdo->prepare("
        SELECT oi.id, oi.product_id, oi.product_code, oi.product_name,
               oi.variant_sku, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = :order_id
    ");
    $stmt->execute(['order_id' => $orderId]);
    $items = $stmt->fetchAll();

    if (empty($items)) {
        $results['warnings'][] = "Nessun articolo trovato per ordine #{$orderId}";
        return $results;
    }

    foreach ($items as $item) {
        $productId = (int)$item['product_id'];
        $variantSku = $item['variant_sku'];
        $qty = (int)$item['quantity'];

        try {
            if ($variantSku) {
                // Product with variant: deduct from variant AND product
                $variantStmt = $pdo->prepare("
                    UPDATE product_variants 
                    SET stock = GREATEST(stock - :qty, 0)
                    WHERE product_id = :product_id AND sku = :sku
                ");
                $variantStmt->execute([
                    'qty' => $qty,
                    'product_id' => $productId,
                    'sku' => $variantSku,
                ]);

                // Also deduct from main product stock
                $productStmt = $pdo->prepare("
                    UPDATE products 
                    SET stock = GREATEST(stock - :qty, 0),
                        updated_at = NOW(3)
                    WHERE id = :id
                ");
                $productStmt->execute([
                    'qty' => $qty,
                    'id' => $productId,
                ]);

                $results['deducted']++;
                $results['details'][] = [
                    'product_code' => $item['product_code'],
                    'variant_sku' => $variantSku,
                    'qty' => $qty,
                    'type' => 'variant',
                ];
            } else {
                // Simple product: deduct from product only
                $productStmt = $pdo->prepare("
                    UPDATE products 
                    SET stock = GREATEST(stock - :qty, 0),
                        updated_at = NOW(3)
                    WHERE id = :id
                ");
                $productStmt->execute([
                    'qty' => $qty,
                    'id' => $productId,
                ]);

                $results['deducted']++;
                $results['details'][] = [
                    'product_code' => $item['product_code'],
                    'variant_sku' => null,
                    'qty' => $qty,
                    'type' => 'simple',
                ];
            }

            error_log("[Stock] ✅ Dedotto {$qty}x {$item['product_code']}" . ($variantSku ? " ({$variantSku})" : ""));

        } catch (Exception $e) {
            $results['warnings'][] = "Errore deduzione stock per {$item['product_code']}: " . $e->getMessage();
            error_log("[Stock] ❌ Errore deduzione {$item['product_code']}: " . $e->getMessage());
        }
    }

    // Marca ordine come decrementato — guard race condition con WHERE IS NULL
    if ($results['deducted'] > 0) {
        $markStmt = $pdo->prepare("
            UPDATE orders SET stock_deducted_at = NOW(3)
            WHERE id = :id AND stock_deducted_at IS NULL
        ");
        $markStmt->execute(['id' => $orderId]);
    }

    return $results;
}
