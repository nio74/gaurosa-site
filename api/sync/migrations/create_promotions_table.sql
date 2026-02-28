-- ============================================================
-- Migration: Crea tabella promotions per gaurosa.it
-- Eseguire su Hostinger MySQL se la tabella non esiste già
-- (viene creata automaticamente anche da api/sync/promotions.php)
-- ============================================================

CREATE TABLE IF NOT EXISTS promotions (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('percentage','fixed_amount','bundle_2_1','cart_threshold','flash_sale','coupon') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_type ENUM('percentage','fixed_amount') NOT NULL DEFAULT 'percentage',
    applies_to ENUM('all_products','category','tag','specific_products') NOT NULL DEFAULT 'all_products',
    category_slug VARCHAR(100),
    tag_slug VARCHAR(100),
    product_codes TEXT,
    bundle_free_percent DECIMAL(5,2),
    cart_min_amount DECIMAL(10,2),
    coupon_code VARCHAR(50) UNIQUE,
    max_uses INT,
    max_uses_per_user INT DEFAULT 1,
    times_used INT DEFAULT 0,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    show_countdown TINYINT(1) DEFAULT 0,
    promo_badge VARCHAR(50),
    promo_message VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_dates (is_active, starts_at, ends_at),
    INDEX idx_type (type),
    INDEX idx_coupon (coupon_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
