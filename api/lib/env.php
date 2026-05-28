<?php
/**
 * Helper lettura ambiente per gaurosa.it
 *
 * Distingue chiaramente dev (PC sviluppo) da prod (Hostinger) tramite
 * un file `.env` nella root del progetto contenente `GAUROSA_ENV=development|production`.
 *
 * Vantaggio rispetto al vecchio sniffing su HTTP_HOST: nessun rischio di
 * confondere ambiente per via di reverse proxy / IP di rete locale / nomi host strani.
 *
 * Fallback: se `.env` non esiste, ricade sul vecchio metodo (sniffing host).
 */

/**
 * Carica una sola volta il contenuto di .env nella radice del progetto.
 * Ritorna un array associativo chiave => valore.
 */
function gaurosaEnvAll(): array {
    static $env = null;
    if ($env !== null) {
        return $env;
    }

    // Path: api/lib/env.php -> ../../.env
    $envPath = __DIR__ . '/../../.env';
    if (!file_exists($envPath)) {
        $env = [];
        return $env;
    }

    // parse_ini_file gestisce automaticamente le quote e i commenti.
    // INI_SCANNER_RAW evita interpretazioni esotiche dei valori.
    $parsed = @parse_ini_file($envPath, false, INI_SCANNER_RAW);
    $env = is_array($parsed) ? $parsed : [];
    return $env;
}

/**
 * Ottieni una singola variabile dall'env.
 * Ordine di precedenza: variabili di processo ($_ENV / getenv) > .env file > default.
 */
function gaurosaEnvVar(string $key, $default = null) {
    // 1) Variabile di processo (utile su Hostinger se configurate via pannello)
    $val = getenv($key);
    if ($val !== false && $val !== '') {
        return $val;
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    // 2) File .env
    $env = gaurosaEnvAll();
    if (isset($env[$key]) && $env[$key] !== '') {
        return $env[$key];
    }
    // 3) Default
    return $default;
}

/**
 * Ambiente corrente: 'development' o 'production'.
 *
 * Logica:
 * - Se .env contiene GAUROSA_ENV, usa quello (modalita' esplicita - preferita)
 * - Altrimenti fallback: deduci da HTTP_HOST (modalita' legacy)
 */
function gaurosaEnv(): string {
    $explicit = gaurosaEnvVar('GAUROSA_ENV');
    if ($explicit === 'development' || $explicit === 'production') {
        return $explicit;
    }

    // Fallback legacy: sniffing host
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $isLocal = $host === 'localhost'
            || strpos($host, 'localhost') !== false
            || $host === '127.0.0.1'
            || strpos($host, '127.0.0.1') !== false;

    return $isLocal ? 'development' : 'production';
}

/**
 * Scorciatoia: true se siamo in development.
 */
function gaurosaIsLocal(): bool {
    return gaurosaEnv() === 'development';
}
