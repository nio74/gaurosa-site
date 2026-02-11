<?php
/**
 * Test Download Immagini da MazGest
 */

header('Content-Type: application/json');

// Database config
if (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'gaurosasite');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u341208956_gaurosasito');
    define('DB_USER', 'u341208956_paolo');
    define('DB_PASS', '6#KvGR!d');
}

define('SYNC_API_KEY', 'gaurosa_prod_2026_secure_key_change_me');

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Include la funzione downloadImage
require_once 'products-simple.php';

try {
    // Test download immagine reale
    $testUrl = '/uploads/jewelry-products/919/img-1769280709892-693382004.png';
    $fullUrl = 'https://api.mazgest.org' . $testUrl;
    
    // Verifica che l'immagine esista
    $headers = @get_headers($fullUrl);
    $imageExists = $headers && strpos($headers[0], '200') !== false;
    
    // Test download
    $result = null;
    if ($imageExists) {
        $result = downloadImage($testUrl, 999, 0);
    }
    
    // Verifica directory
    $uploadDir = __DIR__ . '/../../uploads/products';
    
    jsonResponse([
        'success' => true,
        'test' => [
            'original_url' => $testUrl,
            'full_url' => $fullUrl,
            'image_exists_online' => $imageExists,
            'download_result' => $result,
            'file_saved' => $result ? file_exists(__DIR__ . '/../../' . $result) : false,
        ],
        'environment' => [
            'upload_dir' => $uploadDir,
            'upload_dir_exists' => is_dir($uploadDir),
            'upload_dir_writable' => is_writable($uploadDir),
            'php_version' => PHP_VERSION,
            'curl_enabled' => function_exists('curl_init'),
        ]
    ]);
    
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
?>