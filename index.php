<?php
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

// 404
http_response_code(404);
if (file_exists(__DIR__ . '/out/404.html')) {
    include __DIR__ . '/out/404.html';
} else {
    echo '404 - Pagina non trovata';
}
