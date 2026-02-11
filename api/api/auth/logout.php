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

// Cancella i cookies di autenticazione
clearAuthCookies();

jsonResponse([
    'success' => true,
    'message' => 'Logout effettuato con successo'
]);
