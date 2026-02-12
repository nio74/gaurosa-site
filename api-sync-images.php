<?php
/**
 * API Sync Immagini Ottimizzate
 *
 * POST /api-sync-images.php
 * Riceve UNA immagine ottimizzata alla volta da MazGest (WebP in 3 dimensioni + blur placeholder)
 * e la salva su disco aggiornando la tabella product_images.
 *
 * Body JSON: {
 *   "api_key": "xxx",
 *   "product_code": "M02627",
 *   "image_index": 0,
 *   "is_primary": true,
 *   "sort_order": 0,
 *   "blur_data_uri": "data:image/webp;base64,...",
 *   "sizes": {
 *     "thumb": "base64...",
 *     "medium": "base64...",
 *     "large": "base64..."
 *   }
 * }
 */

require_once __DIR__ . '/api-config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
}

// Leggi body JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'error' => 'JSON non valido o payload troppo grande'], 400);
}

// Verifica API key
$apiKey = $input['api_key'] ?? null;
if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

// Validazione parametri
$productCode = $input['product_code'] ?? null;
$imageIndex = $input['image_index'] ?? null;
$isPrimary = $input['is_primary'] ?? false;
$sortOrder = $input['sort_order'] ?? 0;
$blurDataUri = $input['blur_data_uri'] ?? null;
$sizes = $input['sizes'] ?? null;

if (!$productCode || $imageIndex === null || !$sizes) {
    jsonResponse(['success' => false, 'error' => 'Parametri mancanti: product_code, image_index, sizes sono obbligatori'], 400);
}

if (empty($sizes['thumb']) || empty($sizes['medium']) || empty($sizes['large'])) {
    jsonResponse(['success' => false, 'error' => 'Tutte e 3 le dimensioni (thumb, medium, large) sono obbligatorie'], 400);
}

// Sanitizza product_code (solo alfanumerici e trattini)
$productCode = preg_replace('/[^a-zA-Z0-9\-_]/', '', $productCode);
$imageIndex = (int)$imageIndex;

// Directory di destinazione
$uploadDir = __DIR__ . '/uploads/products/' . $productCode;

// Crea directory se non esiste
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        jsonResponse(['success' => false, 'error' => 'Impossibile creare directory uploads'], 500);
    }
}

$savedFiles = [];
$errors = [];

// Salva ogni dimensione su disco
foreach (['thumb', 'medium', 'large'] as $sizeName) {
    $base64Data = $sizes[$sizeName];

    // Decodifica base64
    $binaryData = base64_decode($base64Data, true);
    if ($binaryData === false) {
        $errors[] = "Errore decodifica base64 per {$sizeName}";
        continue;
    }

    // Nome file: {product_code}_{index}_{size}.webp
    $fileName = "{$productCode}_{$imageIndex}_{$sizeName}.webp";
    $filePath = $uploadDir . '/' . $fileName;
    $relativeUrl = "/uploads/products/{$productCode}/{$fileName}";

    // Scrivi file su disco
    $bytesWritten = file_put_contents($filePath, $binaryData);
    if ($bytesWritten === false) {
        $errors[] = "Errore scrittura file {$fileName}";
        continue;
    }

    $savedFiles[$sizeName] = [
        'path' => $filePath,
        'url' => $relativeUrl,
        'size_bytes' => $bytesWritten,
    ];
}

// Se ci sono errori critici su tutti i file, ritorna errore
if (count($errors) === 3) {
    jsonResponse(['success' => false, 'error' => 'Tutti i file hanno fallito: ' . implode(', ', $errors)], 500);
}

// Aggiorna database - usa la versione "large" come URL principale
$pdo = getDbConnection();

try {
    // Trova il product_id dal codice prodotto
    $stmt = $pdo->prepare("SELECT id FROM products WHERE code = ?");
    $stmt->execute([$productCode]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonResponse(['success' => false, 'error' => "Prodotto con codice '{$productCode}' non trovato nel database"], 404);
    }

    $productId = $product['id'];

    // URL delle diverse dimensioni
    $urlLarge = $savedFiles['large']['url'] ?? null;
    $urlMedium = $savedFiles['medium']['url'] ?? null;
    $urlThumb = $savedFiles['thumb']['url'] ?? null;

    // Cerca se esiste gia' un record per questa immagine (per sort_order)
    $stmt = $pdo->prepare("
        SELECT id FROM product_images 
        WHERE product_id = ? AND sort_order = ?
        LIMIT 1
    ");
    $stmt->execute([$productId, $sortOrder]);
    $existingImage = $stmt->fetch();

    if ($existingImage) {
        // Aggiorna record esistente con URL ottimizzate
        $stmt = $pdo->prepare("
            UPDATE product_images SET
                url = COALESCE(?, url),
                url_medium = ?,
                url_thumb = ?,
                blur_data_uri = ?,
                is_primary = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $urlLarge,
            $urlMedium,
            $urlThumb,
            $blurDataUri,
            $isPrimary ? 1 : 0,
            $existingImage['id'],
        ]);
    } else {
        // Inserisci nuovo record
        $stmt = $pdo->prepare("
            INSERT INTO product_images (product_id, url, url_medium, url_thumb, blur_data_uri, is_primary, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $productId,
            $urlLarge,
            $urlMedium,
            $urlThumb,
            $blurDataUri,
            $isPrimary ? 1 : 0,
            $sortOrder,
        ]);
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'product_code' => $productCode,
            'image_index' => $imageIndex,
            'files_saved' => count($savedFiles),
            'urls' => [
                'thumb' => $urlThumb,
                'medium' => $urlMedium,
                'large' => $urlLarge,
            ],
            'errors' => count($errors) > 0 ? $errors : null,
        ]
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Errore database: ' . $e->getMessage()], 500);
}
