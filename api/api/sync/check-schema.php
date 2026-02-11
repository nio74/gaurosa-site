<?php
/**
 * Verifica Schema Database
 */

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

header('Content-Type: application/json');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Verifica tabelle esistenti
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    // Verifica struttura tabella products
    $productColumns = [];
    if (in_array('products', $tables)) {
        $productColumns = $pdo->query("DESCRIBE products")->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Verifica struttura tabella product_images
    $imageColumns = [];
    if (in_array('product_images', $tables)) {
        $imageColumns = $pdo->query("DESCRIBE product_images")->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Crea tabella product_images se non esiste
    if (!in_array('product_images', $tables)) {
        $pdo->exec("
            CREATE TABLE product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                url VARCHAR(500) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product_id (product_id),
                INDEX idx_primary (is_primary)
            )
        ");
        $imageColumns = $pdo->query("DESCRIBE product_images")->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'tables' => $tables,
            'product_columns' => $productColumns,
            'image_columns' => $imageColumns,
            'product_images_created' => !in_array('product_images', $tables)
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>