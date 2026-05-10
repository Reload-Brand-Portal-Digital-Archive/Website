-- ============================================================
-- Migration: user_locations table
-- Untuk menyimpan koordinat GPS dari visitor yang mengizinkan
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_locations` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL jika guest',
    `client_id`   VARCHAR(100) NOT NULL COMMENT 'Cookie client_id dari tracker.js',
    `latitude`    DECIMAL(10, 8) NOT NULL,
    `longitude`   DECIMAL(11, 8) NOT NULL,
    `ip_address`  VARCHAR(45)  NULL DEFAULT NULL,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_client_id` (`client_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
