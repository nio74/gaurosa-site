<?php
/**
 * API Applica Promozione / Valida Coupon
 *
 * POST /api/apply-promotion.php
 * Calcola sconti applicabili a un carrello e valida coupon.
 *
 * Body JSON:
 * {
 *   "items": [{ "code": "M001", "price": 100, "quantity": 1, "category": "gioielleria", "tags": ["oro-18k"] }],
 *   "subtotal": 100,
 *   "coupon_code": "ESTATE20"   // opzionale
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "discount": 20.00,
 *   "discount_label": "Sconto -20%",
 *   "final_total": 80.00,
 *   "applied_promotions": [...],
 *   "coupon_valid": true,
 *   "coupon_error": null
 * }
 */

require_once __DIR__ . '/config.php';

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

$body    = getJsonBody();
$items   = $body['items'] ?? [];
$subtotal = (float)($body['subtotal'] ?? 0);
$couponCode = trim(strtoupper($body['coupon_code'] ?? ''));

if (empty($items) || $subtotal <= 0) {
    jsonResponse(['success' => false, 'error' => 'Carrello vuoto o importo non valido'], 400);
}

$pdo = getDbConnection();
$now = date('Y-m-d H:i:s');

// ==========================================
// Carica promozioni attive
// ==========================================
$stmt = $pdo->prepare("
    SELECT * FROM promotions
    WHERE is_active = 1 AND starts_at <= ? AND ends_at >= ?
    ORDER BY discount_value DESC
");
$stmt->execute([$now, $now]);
$activePromotions = $stmt->fetchAll();

// ==========================================
// Helper: verifica se una promozione si applica a un prodotto
// ==========================================
function promoAppliesToProduct(array $promo, array $item): bool {
    switch ($promo['applies_to']) {
        case 'all_products':
            return true;
        case 'category':
            return ($item['category'] ?? '') === $promo['category_slug'];
        case 'tag':
            $tags = $item['tags'] ?? [];
            return in_array($promo['tag_slug'], $tags);
        case 'specific_products':
            $codes = $promo['product_codes'] ? json_decode($promo['product_codes'], true) : [];
            return in_array($item['code'], $codes);
        default:
            return false;
    }
}

// ==========================================
// Calcola sconto per un singolo item
// ==========================================
function calcItemDiscount(array $promo, float $price, int $qty): float {
    $discountPerUnit = 0;
    if ($promo['discount_type'] === 'percentage') {
        $discountPerUnit = $price * ((float)$promo['discount_value'] / 100);
    } else {
        $discountPerUnit = min((float)$promo['discount_value'], $price);
    }
    return round($discountPerUnit * $qty, 2);
}

// ==========================================
// Applica promozioni automatiche (non coupon)
// ==========================================
$appliedPromotions = [];
$totalDiscount = 0.0;

// Separa coupon da promozioni automatiche
$automaticPromos = array_filter($activePromotions, fn($p) => $p['type'] !== 'coupon');
$couponPromos    = array_filter($activePromotions, fn($p) => $p['type'] === 'coupon');

foreach ($automaticPromos as $promo) {
    $promoDiscount = 0.0;

    switch ($promo['type']) {
        // ---- Sconto % o fisso su prodotti ----
        case 'percentage':
        case 'fixed_amount':
        case 'flash_sale':
            foreach ($items as $item) {
                if (promoAppliesToProduct($promo, $item)) {
                    $promoDiscount += calcItemDiscount($promo, (float)$item['price'], (int)($item['quantity'] ?? 1));
                }
            }
            break;

        // ---- Bundle 2+1 ----
        case 'bundle_2_1':
            // Collect all eligible units with name info, sort by price ASC
            $eligibleUnits = []; // each entry: ['price' => float, 'name' => string]
            foreach ($items as $item) {
                if (promoAppliesToProduct($promo, $item)) {
                    for ($i = 0; $i < (int)($item['quantity'] ?? 1); $i++) {
                        $eligibleUnits[] = [
                            'price' => (float)$item['price'],
                            'name'  => $item['name'] ?? $item['code'],
                        ];
                    }
                }
            }
            // Sort ASC by price: cheapest first
            usort($eligibleUnits, fn($a, $b) => $a['price'] <=> $b['price']);

            $totalEligible = count($eligibleUnits);
            $freePercent   = (float)($promo['bundle_free_percent'] ?? 100);
            $groups        = intdiv($totalEligible, 3);
            $itemsNeeded   = $totalEligible >= 3 ? 0 : (3 - $totalEligible);

            // Calculate discount for complete groups
            for ($g = 0; $g < $groups; $g++) {
                $cheapestPrice  = $eligibleUnits[$g]['price'];
                $promoDiscount += round($cheapestPrice * ($freePercent / 100), 2);
            }

            // Build bundle_info for the frontend banner
            $cheapestUnit = !empty($eligibleUnits) ? $eligibleUnits[0] : null;
            // What would the discount be if they added one more item?
            $potentialDiscount = 0;
            if ($totalEligible > 0 && $itemsNeeded > 0) {
                $potentialDiscount = round($cheapestUnit['price'] * ($freePercent / 100), 2);
            }

            $bundleInfo = [
                'promo_id'          => $promo['id'],
                'promo_name'        => $promo['name'],
                'free_percent'      => $freePercent,
                'items_in_cart'     => $totalEligible,
                'items_needed'      => $itemsNeeded,
                'groups_active'     => $groups,
                'cheapest_name'     => $cheapestUnit ? $cheapestUnit['name'] : null,
                'cheapest_price'    => $cheapestUnit ? $cheapestUnit['price'] : null,
                'discount_applied'  => $promoDiscount,
                'potential_discount'=> $potentialDiscount,
                'badge'             => $promo['promo_badge'],
                'message'           => $promo['promo_message'],
            ];
            break;

        // ---- Soglia carrello ----
        case 'cart_threshold':
            $minAmount = (float)($promo['cart_min_amount'] ?? 0);
            if ($subtotal >= $minAmount) {
                if ($promo['discount_type'] === 'percentage') {
                    $promoDiscount = round($subtotal * ((float)$promo['discount_value'] / 100), 2);
                } else {
                    $promoDiscount = min((float)$promo['discount_value'], $subtotal);
                }
            }
            break;
    }

    if ($promoDiscount > 0) {
        $appliedPromotions[] = [
            'id'      => $promo['id'],
            'name'    => $promo['name'],
            'type'    => $promo['type'],
            'badge'   => $promo['promo_badge'],
            'message' => $promo['promo_message'],
            'discount' => $promoDiscount,
        ];
        $totalDiscount += $promoDiscount;
    }
}

// ==========================================
// Valida e applica coupon (se fornito)
// ==========================================
$couponValid = false;
$couponError = null;
$couponDiscount = 0.0;

if ($couponCode !== '') {
    // Cerca coupon tra le promozioni attive
    $couponPromo = null;
    foreach ($couponPromos as $cp) {
        if (strtoupper($cp['coupon_code'] ?? '') === $couponCode) {
            $couponPromo = $cp;
            break;
        }
    }

    if (!$couponPromo) {
        $couponError = 'Codice coupon non valido o scaduto';
    } else {
        // Verifica limite utilizzi totali
        if ($couponPromo['max_uses'] !== null && (int)$couponPromo['times_used'] >= (int)$couponPromo['max_uses']) {
            $couponError = 'Questo coupon ha raggiunto il limite massimo di utilizzi';
        } else {
            // Calcola sconto coupon
            if ($couponPromo['discount_type'] === 'percentage') {
                $couponDiscount = round($subtotal * ((float)$couponPromo['discount_value'] / 100), 2);
            } else {
                $couponDiscount = min((float)$couponPromo['discount_value'], $subtotal);
            }

            $couponValid = true;
            $appliedPromotions[] = [
                'id'       => $couponPromo['id'],
                'name'     => $couponPromo['name'],
                'type'     => 'coupon',
                'badge'    => $couponPromo['promo_badge'],
                'message'  => $couponPromo['promo_message'],
                'discount' => $couponDiscount,
                'coupon_code' => $couponCode,
            ];
            $totalDiscount += $couponDiscount;
        }
    }
}

// ==========================================
// Calcola totale finale
// ==========================================
$totalDiscount = min($totalDiscount, $subtotal); // non può superare il subtotale
$finalTotal = round($subtotal - $totalDiscount, 2);

// Etichetta sconto
$discountLabel = '';
if (count($appliedPromotions) === 1) {
    $p = $appliedPromotions[0];
    $discountLabel = $p['badge'] ?: $p['name'];
} elseif (count($appliedPromotions) > 1) {
    $discountLabel = count($appliedPromotions) . ' promozioni applicate';
}

jsonResponse([
    'success'             => true,
    'discount'            => $totalDiscount,
    'discount_label'      => $discountLabel,
    'final_total'         => $finalTotal,
    'applied_promotions'  => $appliedPromotions,
    'coupon_valid'        => $couponValid,
    'coupon_error'        => $couponError,
    'bundle_info'         => $bundleInfo ?? null,
]);
