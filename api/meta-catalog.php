<?php
/**
 * Meta / Facebook Product Catalog Feed
 *
 * GET https://gaurosa.it/api/meta-catalog.php
 *
 * Returns all active products in Meta Catalog JSON format.
 * Add this URL in Meta Commerce Manager → Catalog → Data Sources → Add Feed → Scheduled URL.
 * Recommended refresh: every 24 hours.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/catalog/reference
 */

require_once __DIR__ . '/config.php';

// Public endpoint — no auth required (Meta fetches it like a sitemap)
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600'); // Cache 1h on CDN

// Map subcategory → Google Product Category ID (jewelry)
// https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
function getGoogleCategory(?string $subcategory, ?string $mainCategory): string {
    $sub = strtolower($subcategory ?? '');
    $main = strtolower($mainCategory ?? '');

    if (str_contains($sub, 'anello') || str_contains($sub, 'ring'))       return '191'; // Rings
    if (str_contains($sub, 'bracciale') || str_contains($sub, 'bracelet')) return '189'; // Bracelets
    if (str_contains($sub, 'collana') || str_contains($sub, 'necklace'))   return '192'; // Necklaces
    if (str_contains($sub, 'orecchini') || str_contains($sub, 'earring'))  return '190'; // Earrings
    if (str_contains($sub, 'ciondolo') || str_contains($sub, 'pendant'))   return '6463'; // Pendants
    if (str_contains($main, 'orologio') || str_contains($main, 'watch'))   return '201'; // Watches
    return '188'; // Jewelry (generic)
}

// Map stock_status → Meta availability
function getAvailability(?string $stockStatus, int $stock): string {
    if ($stockStatus === 'out_of_stock' || $stock <= 0) return 'out of stock';
    if ($stockStatus === 'preorder')                     return 'preorder';
    return 'in stock';
}

// Map item_condition → Meta condition
function getCondition(?string $condition): string {
    $c = strtolower($condition ?? 'nuovo');
    if (str_contains($c, 'usato') || str_contains($c, 'used'))       return 'used';
    if (str_contains($c, 'ricondizionato') || str_contains($c, 'refurbished')) return 'refurbished';
    return 'new';
}

try {
    $pdo = getDbConnection();

    // Fetch all active products with their primary image and brand
    $stmt = $pdo->query("
        SELECT
            p.id,
            p.code,
            p.ean,
            p.name,
            p.slug,
            p.description,
            p.description_it,
            p.main_category,
            p.subcategory,
            p.price,
            p.compare_at_price,
            p.stock,
            p.stock_status,
            p.item_condition,
            p.material_primary,
            p.material_color,
            b.name AS brand_name,
            (
                SELECT pi.url
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC, pi.sort_order ASC
                LIMIT 1
            ) AS image_url,
            (
                SELECT GROUP_CONCAT(pi2.url ORDER BY pi2.sort_order ASC SEPARATOR '|')
                FROM product_images pi2
                WHERE pi2.product_id = p.id AND pi2.is_primary = 0
                LIMIT 9
            ) AS additional_images
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.is_active = 1
        ORDER BY p.id ASC
    ");

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [];

    foreach ($products as $p) {
        // Skip products without an image (Meta requires it)
        if (empty($p['image_url'])) continue;

        // Ensure image URL is absolute
        $imageUrl = $p['image_url'];
        if (!str_starts_with($imageUrl, 'http')) {
            $imageUrl = 'https://gaurosa.it/' . ltrim($imageUrl, '/');
        }

        // Additional images (up to 9)
        $additionalImages = [];
        if (!empty($p['additional_images'])) {
            foreach (explode('|', $p['additional_images']) as $imgUrl) {
                if (!str_starts_with($imgUrl, 'http')) {
                    $imgUrl = 'https://gaurosa.it/' . ltrim($imgUrl, '/');
                }
                $additionalImages[] = $imgUrl;
            }
        }

        // Description: prefer Italian, fallback to generic
        $description = $p['description_it'] ?? $p['description'] ?? '';
        if (empty(trim($description))) {
            // Build a minimal description from attributes
            $parts = array_filter([
                $p['name'],
                $p['material_primary'] ? 'in ' . $p['material_primary'] : null,
                $p['material_color'] ?? null,
            ]);
            $description = implode(' ', $parts);
        }
        // Meta requires description ≥ 30 chars
        if (strlen($description) < 30) {
            $description = $p['name'] . ' — Gioiello artigianale Gaurosa.';
        }
        // Truncate to 5000 chars (Meta limit)
        $description = mb_substr(strip_tags($description), 0, 5000);

        $item = [
            'id'                    => $p['code'],
            'title'                 => $p['name'],
            'description'           => $description,
            'availability'          => getAvailability($p['stock_status'], (int)$p['stock']),
            'condition'             => getCondition($p['item_condition']),
            'price'                 => number_format((float)$p['price'], 2, '.', '') . ' EUR',
            'link'                  => 'https://gaurosa.it/prodotti/' . $p['code'],
            'image_link'            => $imageUrl,
            'brand'                 => $p['brand_name'] ?? 'Gaurosa',
            'google_product_category' => getGoogleCategory($p['subcategory'], $p['main_category']),
        ];

        // Optional: sale price
        if (!empty($p['compare_at_price']) && (float)$p['compare_at_price'] > (float)$p['price']) {
            $item['sale_price'] = $item['price'];
            $item['price']      = number_format((float)$p['compare_at_price'], 2, '.', '') . ' EUR';
        }

        // Optional: EAN/GTIN
        if (!empty($p['ean'])) {
            $item['gtin'] = $p['ean'];
        }

        // Optional: additional images
        if (!empty($additionalImages)) {
            $item['additional_image_link'] = implode(',', $additionalImages);
        }

        $data[] = $item;
    }

    echo json_encode([
        'data' => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log('[meta-catalog] Error: ' . $e->getMessage());
}
