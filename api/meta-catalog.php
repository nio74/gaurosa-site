<?php
/**
 * Meta / Facebook Product Catalog Feed — RSS/XML format
 *
 * GET https://gaurosa.it/api/meta-catalog.php
 *
 * Returns all active products in Google Merchant Center RSS/XML format,
 * which is fully supported by Meta Commerce Manager as a scheduled feed.
 *
 * Add this URL in Meta Commerce Manager → Catalog → Data Sources → Add Feed → Scheduled URL.
 * Recommended refresh: every 24 hours.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/catalog/reference
 * Format: https://support.google.com/merchants/answer/7052112
 */

require_once __DIR__ . '/config.php';

// Public endpoint — no auth required (Meta fetches it like a sitemap)
header('Content-Type: application/rss+xml; charset=utf-8');
header('Cache-Control: public, max-age=3600'); // Cache 1h on CDN

// Map subcategory → Google Product Category ID (jewelry)
// https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
function getGoogleCategory(?string $subcategory, ?string $mainCategory): string {
    $sub  = strtolower($subcategory ?? '');
    $main = strtolower($mainCategory ?? '');

    if (str_contains($sub, 'anello')    || str_contains($sub, 'ring'))       return '191';  // Rings
    if (str_contains($sub, 'bracciale') || str_contains($sub, 'bracelet'))   return '189';  // Bracelets
    if (str_contains($sub, 'collana')   || str_contains($sub, 'necklace'))   return '192';  // Necklaces
    if (str_contains($sub, 'orecchini') || str_contains($sub, 'earring'))    return '190';  // Earrings
    if (str_contains($sub, 'ciondolo')  || str_contains($sub, 'pendant'))    return '6463'; // Pendants
    if (str_contains($main, 'orologio') || str_contains($main, 'watch'))     return '201';  // Watches
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
    if (str_contains($c, 'usato')        || str_contains($c, 'used'))        return 'used';
    if (str_contains($c, 'ricondizionato') || str_contains($c, 'refurbished')) return 'refurbished';
    return 'new';
}

// Safely escape a string for XML CDATA
function xmlCdata(string $value): string {
    return '<![CDATA[' . str_replace(']]>', ']]]]><![CDATA[>', $value) . ']]>';
}

// Safely escape a string for XML attribute/text
function xmlEscape(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
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

    // Build RSS/XML output
    $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' . "\n";
    $xml .= '  <channel>' . "\n";
    $xml .= '    <title>Gaurosa Gioielli - Catalogo Prodotti</title>' . "\n";
    $xml .= '    <link>https://gaurosa.it</link>' . "\n";
    $xml .= '    <description>Catalogo prodotti Gaurosa Gioielli per Meta Commerce Manager</description>' . "\n";

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
                $imgUrl = trim($imgUrl);
                if (empty($imgUrl)) continue;
                if (!str_starts_with($imgUrl, 'http')) {
                    $imgUrl = 'https://gaurosa.it/' . ltrim($imgUrl, '/');
                }
                $additionalImages[] = $imgUrl;
            }
        }

        // Description: prefer Italian, fallback to generic
        $description = trim($p['description_it'] ?? $p['description'] ?? '');
        if (empty($description)) {
            $parts = array_filter([
                $p['name'],
                $p['material_primary'] ? 'in ' . $p['material_primary'] : null,
                $p['material_color'] ?? null,
            ]);
            $description = implode(' ', $parts);
        }
        // Meta requires description >= 30 chars
        if (mb_strlen($description) < 30) {
            $description = $p['name'] . ' — Gioiello artigianale Gaurosa.';
        }
        // Truncate to 5000 chars (Meta limit)
        $description = mb_substr(strip_tags($description), 0, 5000);

        // Price logic: if compare_at_price > price → sale
        $regularPrice = (float)$p['price'];
        $comparePrice = (float)($p['compare_at_price'] ?? 0);
        $hasSale      = $comparePrice > $regularPrice && $comparePrice > 0;

        $priceStr     = number_format($hasSale ? $comparePrice : $regularPrice, 2, '.', '') . ' EUR';
        $salePriceStr = $hasSale ? number_format($regularPrice, 2, '.', '') . ' EUR' : null;

        $brand        = xmlEscape($p['brand_name'] ?? 'Gaurosa');
        $title        = xmlEscape($p['name']);
        $productLink  = 'https://gaurosa.it/prodotti/' . xmlEscape($p['code']);
        $availability = xmlEscape(getAvailability($p['stock_status'], (int)$p['stock']));
        $condition    = xmlEscape(getCondition($p['item_condition']));
        $googleCat    = xmlEscape(getGoogleCategory($p['subcategory'], $p['main_category']));

        $xml .= '    <item>' . "\n";
        $xml .= '      <g:id>'          . xmlEscape($p['code']) . '</g:id>' . "\n";
        $xml .= '      <g:title>'       . $title . '</g:title>' . "\n";
        $xml .= '      <g:description>' . xmlCdata($description) . '</g:description>' . "\n";
        $xml .= '      <g:link>'        . $productLink . '</g:link>' . "\n";
        $xml .= '      <g:image_link>'  . xmlEscape($imageUrl) . '</g:image_link>' . "\n";
        $xml .= '      <g:availability>' . $availability . '</g:availability>' . "\n";
        $xml .= '      <g:price>'       . xmlEscape($priceStr) . '</g:price>' . "\n";

        if ($salePriceStr) {
            $xml .= '      <g:sale_price>' . xmlEscape($salePriceStr) . '</g:sale_price>' . "\n";
        }

        $xml .= '      <g:condition>'   . $condition . '</g:condition>' . "\n";
        $xml .= '      <g:brand>'       . $brand . '</g:brand>' . "\n";
        $xml .= '      <g:google_product_category>' . $googleCat . '</g:google_product_category>' . "\n";

        // Optional: GTIN/EAN
        if (!empty($p['ean'])) {
            $xml .= '      <g:gtin>' . xmlEscape($p['ean']) . '</g:gtin>' . "\n";
        } else {
            // No GTIN — tell Meta to skip GTIN validation
            $xml .= '      <g:identifier_exists>no</g:identifier_exists>' . "\n";
        }

        // Optional: additional images (up to 9)
        foreach (array_slice($additionalImages, 0, 9) as $addImg) {
            $xml .= '      <g:additional_image_link>' . xmlEscape($addImg) . '</g:additional_image_link>' . "\n";
        }

        $xml .= '    </item>' . "\n";
    }

    $xml .= '  </channel>' . "\n";
    $xml .= '</rss>' . "\n";

    echo $xml;

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    error_log('[meta-catalog] Error: ' . $e->getMessage());
    echo 'Internal server error';
}
