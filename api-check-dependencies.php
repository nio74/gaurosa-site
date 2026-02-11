<?php
/**
 * API Check Dependencies
 * 
 * POST /api-check-dependencies.php
 * Verifica se categorie, tag e attributi esistono prima del sync prodotti
 * 
 * Body JSON: { "products": [...], "api_key": "xxx" }
 */

require_once __DIR__ . '/api-config.php';

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// POST: Verifica dipendenze
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            jsonResponse(['success' => false, 'error' => 'JSON non valido'], 400);
        }

        $apiKey = $input['api_key'] ?? null;
        if ($apiKey !== 'gaurosa_prod_2026_secure_key_change_me') {
            jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
        }

        $products = $input['products'] ?? [];
        if (!is_array($products)) {
            jsonResponse(['success' => false, 'error' => 'Formato prodotti non valido'], 400);
        }

        $pdo = getDbConnection();
        
        // Raccogli tutte le dipendenze dai prodotti
        $requiredCategories = [];
        $requiredTags = [];
        $requiredAttributeValues = [];
        
        foreach ($products as $product) {
            // Categorie
            if (!empty($product['main_category'])) {
                $requiredCategories[] = $product['main_category'];
            }
            if (!empty($product['subcategory'])) {
                $requiredCategories[] = $product['subcategory'];
            }
            
            // Tag (se presenti)
            if (!empty($product['tags']) && is_array($product['tags'])) {
                foreach ($product['tags'] as $tag) {
                    if (!empty($tag['code'])) {
                        $requiredTags[] = [
                            'code' => $tag['code'],
                            'label' => $tag['label'] ?? $tag['code'],
                            'type' => $tag['type'] ?? 'special'
                        ];
                    }
                }
            }
            
            // Attributi - controlla tutti i campi attributo
            $attributeFields = [
                'material_primary', 'material_color', 'material_weight_grams',
                'stone_main_type', 'stone_main_carats', 'stone_main_color', 
                'stone_main_clarity', 'stone_main_cut', 'stone_main_certificate',
                'stones_secondary_type', 'stones_secondary_count',
                'pearl_type', 'pearl_size_mm', 'pearl_color',
                'size_ring_it', 'size_bracelet_cm', 'size_necklace_cm', 'size_earring_mm',
                'ring_type', 'ring_style', 'earring_type', 'bracelet_type', 
                'necklace_type', 'pendant_type', 'watch_gender', 'watch_type', 
                'watch_movement', 'item_condition'
            ];
            
            foreach ($attributeFields as $field) {
                if (!empty($product[$field])) {
                    $requiredAttributeValues[] = [
                        'attribute' => $field,
                        'value' => $product[$field]
                    ];
                }
            }
        }
        
        // Rimuovi duplicati
        $requiredCategories = array_unique($requiredCategories);
        $requiredTags = array_unique($requiredTags, SORT_REGULAR);
        $requiredAttributeValues = array_unique($requiredAttributeValues, SORT_REGULAR);
        
        // Verifica categorie esistenti
        $missingCategories = [];
        if (!empty($requiredCategories)) {
            $placeholders = str_repeat('?,', count($requiredCategories) - 1) . '?';
            $stmt = $pdo->prepare("SELECT name FROM categories WHERE name IN ($placeholders)");
            $stmt->execute($requiredCategories);
            $existingCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $missingCategories = array_diff($requiredCategories, $existingCategories);
        }
        
        // Verifica tag esistenti
        $missingTags = [];
        if (!empty($requiredTags)) {
            $tagCodes = array_column($requiredTags, 'code');
            $placeholders = str_repeat('?,', count($tagCodes) - 1) . '?';
            $stmt = $pdo->prepare("SELECT code FROM tags WHERE code IN ($placeholders)");
            $stmt->execute($tagCodes);
            $existingTagCodes = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($requiredTags as $tag) {
                if (!in_array($tag['code'], $existingTagCodes)) {
                    $missingTags[] = $tag;
                }
            }
        }
        
        // Verifica valori attributi esistenti
        $missingAttributeValues = [];
        if (!empty($requiredAttributeValues)) {
            foreach ($requiredAttributeValues as $attrValue) {
                // Controlla se l'attributo esiste
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM attribute_filters WHERE attribute_code = ?");
                $stmt->execute([$attrValue['attribute']]);
                $attributeExists = $stmt->fetchColumn() > 0;
                
                if (!$attributeExists) {
                    $missingAttributeValues[] = [
                        'attribute' => $attrValue['attribute'],
                        'value' => $attrValue['value'],
                        'reason' => 'attribute_missing'
                    ];
                    continue;
                }
                
                // Controlla se il valore esiste
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM attribute_filter_values WHERE attribute_code = ? AND value = ?");
                $stmt->execute([$attrValue['attribute'], $attrValue['value']]);
                $valueExists = $stmt->fetchColumn() > 0;
                
                if (!$valueExists) {
                    $missingAttributeValues[] = [
                        'attribute' => $attrValue['attribute'],
                        'value' => $attrValue['value'],
                        'reason' => 'value_missing'
                    ];
                }
            }
        }
        
        // Calcola totale dipendenze mancanti
        $totalMissing = count($missingCategories) + count($missingTags) + count($missingAttributeValues);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'has_missing_dependencies' => $totalMissing > 0,
                'total_missing' => $totalMissing,
                'missing_categories' => array_values($missingCategories),
                'missing_tags' => array_values($missingTags),
                'missing_attribute_values' => array_values($missingAttributeValues),
                'summary' => [
                    'categories' => count($missingCategories),
                    'tags' => count($missingTags),
                    'attribute_values' => count($missingAttributeValues)
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Errore verifica dipendenze: ' . $e->getMessage()
        ], 500);
    }
}

// GET: Info endpoint
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse([
        'success' => true,
        'data' => [
            'endpoint' => 'check-dependencies',
            'description' => 'Verifica dipendenze prima del sync prodotti',
            'methods' => ['POST'],
            'requires_api_key' => true
        ]
    ]);
}

jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);