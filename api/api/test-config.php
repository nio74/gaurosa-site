<?php
require_once __DIR__ . '/config.php';

echo "SYNC_API_KEY: " . (defined('SYNC_API_KEY') ? SYNC_API_KEY : 'NOT DEFINED') . "\n";
echo "DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'NOT DEFINED') . "\n";
echo "IS_LOCAL: " . (defined('IS_LOCAL') ? (IS_LOCAL ? 'true' : 'false') : 'NOT DEFINED') . "\n";
?>