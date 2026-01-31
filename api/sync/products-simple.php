<?php
/**
 * API Sync Prodotti - Versione Semplificata
 * 
 * POST /api/sync/products-simple.php
 * Versione minima per debug
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API Key
define('SYNC_API_KEY', 'gaurosa_prod_2026_secure_key_change_me');

// Database config
if (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false) {
    // Locale
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'gaurosasite');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // Hostinger
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u341208956_gaurosasito');
    define('DB_USER', 'u341208956_paolo');
    define('DB_PASS', '6#KvGR!d');
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getDbConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Scarica immagine da MazGest e salva in /uploads/products su Hostinger
 */
function downloadImage($originalUrl, $productId, $index) {
    try {
        // URL base MazGest pubblico
        $mazgestUrl = 'https://api.mazgest.org';
        
        // Costruisci URL completo
        $fullUrl = $originalUrl;
        if (strpos($originalUrl, 'http') !== 0) {
            $fullUrl = $mazgestUrl . $originalUrl;
        }
        
        // Log per debug
        error_log("Downloading image: {$fullUrl}");
        
        // Scarica immagine con cURL per maggiore controllo
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Gaurosa-Sync/1.0');
        
        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($imageData === false || $httpCode !== 200) {
            error_log("Failed to download image: HTTP {$httpCode}");
            return null;
        }
        
        // Determina estensione dal Content-Type o URL
        $pathInfo = pathinfo($originalUrl);
        $extension = strtolower($pathInfo['extension'] ?? 'jpg');
        
        // Valida estensione
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($extension, $allowedExtensions)) {
            $extension = 'jpg';
        }
        
        // Nome file unico
        $fileName = "product_{$productId}_{$index}_{" . time() . "}.{$extension}";
        $uploadDir = __DIR__ . "/../../uploads/products";
        $localPath = "{$uploadDir}/{$fileName}";
        
        // Crea directory se non esiste
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Salva file
        if (file_put_contents($localPath, $imageData) !== false) {
            $localUrl = "/uploads/products/{$fileName}";
            error_log("Image saved successfully: {$localUrl}");
            return $localUrl;
        }
        
        error_log("Failed to save image to: {$localPath}");
        return null;
        
    } catch (Exception $e) {
        error_log("Errore download immagine: " . $e->getMessage());
        return null;
    }
}

// GET: Test
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
        $count = $stmt->fetch()['count'];
        
        jsonResponse([
            'success' => true,
            'data' => [
                'product_count' => (int)$count,
                'server_time' => date('Y-m-d H:i:s'),
                'php_version' => PHP_VERSION
            ]
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// POST: Sync prodotti
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $startTime = microtime(true);
        
        // Leggi body JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
        }
        
        // Verifica API key
        $apiKey = $input['api_key'] ?? null;
        if ($apiKey !== SYNC_API_KEY) {
            jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
        }
        
        $products = $input['products'] ?? [];
        if (!is_array($products)) {
            jsonResponse(['success' => false, 'error' => 'Formato dati non valido'], 400);
        }
        
        $pdo = getDbConnection();
        $processed = 0;
        $failed = 0;
        $errors = [];
        
        foreach ($products as $product) {
            try {
                $pdo->beginTransaction();
                
                // Inserimento prodotto
                $stmt = $pdo->prepare("
                    INSERT INTO products (
                        mazgest_id, code, name, price, stock, main_category, subcategory, created_at, updated_at
                    ) VALUES (
                        :mazgest_id, :code, :name, :price, :stock, :main_category, :subcategory, NOW(), NOW()
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        price = VALUES(price),
                        stock = VALUES(stock),
                        main_category = VALUES(main_category),
                        subcategory = VALUES(subcategory),
                        updated_at = NOW()
                ");
                
                $stmt->execute([
                    'mazgest_id' => $product['id'] ?? null,
                    'code' => $product['code'] ?? null,
                    'name' => $product['name'] ?? 'Prodotto senza nome',
                    'price' => $product['public_price'] ?? 0,
                    'stock' => $product['stock'] ?? 0,
                    'main_category' => $product['main_category'] ?? null,
                    'subcategory' => $product['subcategory'] ?? null,
                ]);
                
                $productId = $pdo->lastInsertId() ?: $pdo->query("SELECT id FROM products WHERE mazgest_id = " . ($product['id'] ?? 0))->fetchColumn();
                
                // Gestione immagini
                if (!empty($product['images']) && $productId) {
                    // Rimuovi immagini esistenti
                    $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$productId]);
                    
                    // Crea directory se non esiste
                    $uploadDir = __DIR__ . '/../../uploads/products';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    
                    // Inserisci nuove immagini
                    $imgStmt = $pdo->prepare("
                        INSERT INTO product_images (product_id, url, is_primary, sort_order, created_at) 
                        VALUES (?, ?, ?, ?, NOW())
                    ");
                    
                    foreach ($product['images'] as $index => $image) {
                        $originalUrl = $image['url'] ?? '';
                        $localUrl = $originalUrl;
                        
                        // Scarica immagine se è un URL di MazGest
                        if (!empty($originalUrl) && strpos($originalUrl, '/uploads/jewelry-products/') !== false) {
                            $localUrl = downloadImage($originalUrl, $productId, $index);
                        }
                        
                        $imgStmt->execute([
                            $productId,
                            $localUrl ?: $originalUrl,
                            $image['is_primary'] ?? ($index === 0 ? 1 : 0),
                            $image['sort_order'] ?? $index
                        ]);
                    }
                }
                
                $pdo->commit();
                $processed++;
                
            } catch (Exception $e) {
                $failed++;
                $errors[] = "Prodotto {$product['id']}: " . $e->getMessage();
            }
        }
        
        $durationMs = round((microtime(true) - $startTime) * 1000);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'total' => count($products),
                'processed' => $processed,
                'failed' => $failed,
                'duration_ms' => $durationMs,
                'errors' => $errors ?: null
            ]
        ]);
        
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
?>