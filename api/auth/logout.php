<?php
/**
 * API Logout - POST /api/auth/logout.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/jwt.php';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Il logout con JWT è gestito lato client (rimuove il token)
// Questo endpoint serve solo per conferma e per eventuale blacklist futura

$authUser = getAuthUser();

if ($authUser) {
    // Potremmo aggiungere il token a una blacklist qui
    // Per ora, semplicemente confermiamo il logout
    jsonResponse([
        'success' => true,
        'message' => 'Logout effettuato con successo'
    ]);
} else {
    // Anche se non autenticato, conferma logout
    jsonResponse([
        'success' => true,
        'message' => 'Logout effettuato'
    ]);
}
