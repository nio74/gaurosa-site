<?php
/**
 * API Maintenance Mode - gaurosa.it
 * 
 * GET  → Stato attuale manutenzione
 * POST → Attiva/disattiva manutenzione
 * 
 * Autenticazione via SYNC_API_KEY (stessa chiave usata per sync prodotti)
 */

require_once __DIR__ . '/api-config.php';

$maintenanceFile = __DIR__ . '/maintenance.json';

// Default maintenance state
$defaultState = [
    'enabled' => false,
    'message' => 'Stiamo aggiornando il sito. Torna presto!',
    'allowed_ips' => [],
];

/**
 * Read current maintenance state
 */
function readMaintenanceState($file, $default) {
    if (!file_exists($file)) {
        return $default;
    }
    $data = json_decode(file_get_contents($file), true);
    if (!$data) {
        return $default;
    }
    return array_merge($default, $data);
}

/**
 * Write maintenance state
 */
function writeMaintenanceState($file, $state) {
    $result = file_put_contents($file, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $result !== false;
}

// --- Handle OPTIONS (CORS preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true]);
}

// --- Authenticate ---
$body = getJsonBody();
$apiKey = $body['api_key'] 
    ?? $_SERVER['HTTP_X_API_KEY'] 
    ?? $_GET['api_key'] 
    ?? null;

if ($apiKey !== SYNC_API_KEY) {
    jsonResponse(['success' => false, 'error' => 'API key non valida'], 401);
}

// --- GET: Read maintenance state ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $state = readMaintenanceState($maintenanceFile, $defaultState);
    jsonResponse([
        'success' => true,
        'data' => $state,
    ]);
}

// --- POST: Toggle maintenance mode ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $currentState = readMaintenanceState($maintenanceFile, $defaultState);

    // Read parameters from body
    $enabled = $body['enabled'] ?? null;
    $message = $body['message'] ?? null;
    $allowedIps = $body['allowed_ips'] ?? null;

    // Update state
    if ($enabled !== null) {
        $currentState['enabled'] = (bool) $enabled;
    }
    if ($message !== null) {
        $currentState['message'] = (string) $message;
    }
    if ($allowedIps !== null && is_array($allowedIps)) {
        $currentState['allowed_ips'] = $allowedIps;
    }

    // Add timestamp
    if ($currentState['enabled']) {
        $currentState['enabled_at'] = date('Y-m-d H:i:s');
    } else {
        $currentState['enabled_at'] = null;
    }

    // Write state
    if (writeMaintenanceState($maintenanceFile, $currentState)) {
        jsonResponse([
            'success' => true,
            'data' => $currentState,
            'message' => $currentState['enabled'] 
                ? 'Modalita manutenzione ATTIVATA' 
                : 'Modalita manutenzione DISATTIVATA',
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'error' => 'Errore scrittura file maintenance.json',
        ], 500);
    }
}

// --- Method not allowed ---
jsonResponse(['success' => false, 'error' => 'Metodo non supportato'], 405);
