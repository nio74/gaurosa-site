<?php
/**
 * API Prodotti per Frontend
 * 
 * GET /api/products.php
 * Restituisce prodotti per il sito e-commerce
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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
        jsonResponse(['success' => false, 'error' => 'Database connection failed'], 500);
    }
}

// GET: Lista prodotti
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDbConnection();
        
        // Parametri query
        $category = $_GET['category'] ?? null;
        $subcategory = $_GET['subcategory'] ?? null;
        $search = $_GET['search'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 100); // Max 100
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        // Costruisci WHERE
        $where = ['1=1']; // Sempre vero
        $params = [];
        
        if ($category && $category !== 'all') {
            $where[] = 'main_category = :category';
            $params['category'] = $category;
        }
        
        if ($subcategory && $subcategory !== 'all') {
            $where[] = 'subcategory = :subcategory';
            $params['subcategory'] = $subcategory;
        }
        
        if ($search) {
            $where[] = '(name LIKE :search OR code LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }
        
        // Query prodotti
        $sql = "
            SELECT 
                id,
                mazgest_id,
                code,
                name,
                price,
                compare_at_price,
                stock,
                main_category,
                subcategory,
                created_at,
                updated_at
            FROM products 
            WHERE " . implode(' AND ', $where) . "
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $pdo->prepare($sql);
        
        // Bind parametri
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $products = $stmt->fetchAll();
        
        // Count totale
        $countSql = "SELECT COUNT(*) as total FROM products WHERE " . implode(' AND ', $where);
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(':' . $key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch()['total'];
        
        // Formatta prodotti per frontend
        $formattedProducts = array_map(function($product) {
            return [
                'id' => (int)$product['id'],
                'mazgestId' => (int)$product['mazgest_id'],
                'code' => $product['code'],
                'name' => $product['name'],
                'price' => (float)$product['price'],
                'compareAtPrice' => $product['compare_at_price'] ? (float)$product['compare_at_price'] : null,
                'stock' => (int)$product['stock'],
                'inStock' => (int)$product['stock'] > 0,
                'category' => $product['main_category'],
                'subcategory' => $product['subcategory'],
                'slug' => strtolower($product['code']), // Slug semplice
                'images' => [], // TODO: Aggiungere immagini
                'createdAt' => $product['created_at'],
                'updatedAt' => $product['updated_at'],
            ];
        }, $products);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'products' => $formattedProducts,
                'pagination' => [
                    'total' => (int)$total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'pages' => ceil($total / $limit),
                    'hasMore' => ($offset + $limit) < $total
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// Metodo non supportato
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
?>