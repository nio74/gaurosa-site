<?php
// === CHECK MANUTENZIONE ===
// Bypass per API (sync MazGest, maintenance toggle, etc.)
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$isApiRequest = strpos($requestUri, '/api-') === 0 || strpos($requestUri, '/api/') === 0;

if (!$isApiRequest) {
    $maintenanceFile = __DIR__ . '/maintenance.json';
    if (file_exists($maintenanceFile)) {
        $maintenance = json_decode(file_get_contents($maintenanceFile), true);
        if ($maintenance && !empty($maintenance['enabled'])) {
            // Check IP whitelist
            $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
            $allowedIps = $maintenance['allowed_ips'] ?? [];
            if (!in_array($clientIp, $allowedIps)) {
                http_response_code(503);
                header('Retry-After: 3600');
                include __DIR__ . '/maintenance.html';
                exit;
            }
        }
    }
}

// Router semplice per servire i file statici da out/
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Homepage
if ($path === '/' || $path === '') {
    include 'out/index.html';
    exit;
}

// Rimuovi trailing slash
$path = rtrim($path, '/');

// File statici (_next, images, etc)
$staticFile = __DIR__ . '/out' . $path;
if (file_exists($staticFile) && is_file($staticFile)) {
    $ext = pathinfo($staticFile, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
    ];
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile($staticFile);
    exit;
}

// Pagine HTML (senza estensione)
$htmlFile = __DIR__ . '/out' . $path . '.html';
if (file_exists($htmlFile)) {
    include $htmlFile;
    exit;
}

// Pagine con trailing slash (cartelle con index.html)
$indexFile = __DIR__ . '/out' . $path . '/index.html';
if (file_exists($indexFile)) {
    include $indexFile;
    exit;
}

// Dynamic routes fallback: serve a pre-rendered shell for client-side rendering
// /prodotti/XXXXX → serve the product detail shell (client fetches data via API)
if (preg_match('#^/prodotti/([A-Za-z0-9_-]+)$#', $path)) {
    // Serve any pre-generated product page as shell - ProductDetailClient reads code from URL
    $shellFile = __DIR__ . '/out/prodotti/M01012/index.html';
    if (file_exists($shellFile)) {
        include $shellFile;
        exit;
    }
}

// 404
http_response_code(404);
if (file_exists(__DIR__ . '/out/404.html')) {
    include __DIR__ . '/out/404.html';
} else {
    echo '404 - Pagina non trovata';
}
