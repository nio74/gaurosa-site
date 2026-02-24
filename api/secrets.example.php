<?php
/**
 * Secrets Configuration Template
 * 
 * Copy this file to secrets.php and fill in your credentials.
 * NEVER commit secrets.php to git!
 */

return [
    // Database - Local (XAMPP)
    'db_local' => [
        'host' => 'localhost',
        'name' => 'gaurosasite',
        'user' => 'root',
        'pass' => '',
    ],
    // Database - Production (Hostinger)
    'db_production' => [
        'host' => 'localhost',
        'name' => 'YOUR_DB_NAME',
        'user' => 'YOUR_DB_USER',
        'pass' => 'YOUR_DB_PASS',
    ],
    // JWT
    'jwt_secret' => 'CHANGE_ME_RANDOM_STRING',
    // MazGest API
    'mazgest_api_key' => 'CHANGE_ME',
    // Sync API Key
    'sync_api_key' => 'CHANGE_ME',
    // SMTP
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'user' => 'noreplay@gaurosa.it',
        'pass' => 'CHANGE_ME',
    ],
    // Google OAuth
    'google_client_id' => 'YOUR_GOOGLE_CLIENT_ID',
    'google_client_secret' => 'YOUR_GOOGLE_CLIENT_SECRET',
    // Stripe
    'stripe_secret_key_test' => 'sk_test_CHANGE_ME',
    'stripe_secret_key_live' => 'sk_live_CHANGE_ME',
    'stripe_webhook_secret_test' => 'whsec_CHANGE_ME',
    'stripe_webhook_secret_live' => 'whsec_CHANGE_ME',
    // PayPal
    'paypal_client_id_sandbox' => 'YOUR_PAYPAL_SANDBOX_CLIENT_ID',
    'paypal_secret_sandbox' => 'YOUR_PAYPAL_SANDBOX_SECRET',
    'paypal_client_id_live' => 'YOUR_PAYPAL_LIVE_CLIENT_ID',
    'paypal_secret_live' => 'YOUR_PAYPAL_LIVE_SECRET',
];
