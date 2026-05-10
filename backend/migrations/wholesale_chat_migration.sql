-- Migration: Wholesale-Chat Integration
-- Run this against your MySQL database (MySQL 8.0 compatible)
-- Each ALTER is wrapped in a stored procedure to safely skip if column exists.

-- ── chats table ──────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS add_message_type;
DELIMITER //
CREATE PROCEDURE add_message_type()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'chats'
      AND column_name  = 'message_type'
  ) THEN
    ALTER TABLE chats ADD COLUMN message_type VARCHAR(50) NOT NULL DEFAULT 'text';
  END IF;
END //
DELIMITER ;
CALL add_message_type();
DROP PROCEDURE IF EXISTS add_message_type;

DROP PROCEDURE IF EXISTS add_metadata;
DELIMITER //
CREATE PROCEDURE add_metadata()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'chats'
      AND column_name  = 'metadata'
  ) THEN
    ALTER TABLE chats ADD COLUMN metadata JSON NULL;
  END IF;
END //
DELIMITER ;
CALL add_metadata();
DROP PROCEDURE IF EXISTS add_metadata;

-- ── wholesale_orders table ───────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS add_shop_name;
DELIMITER //
CREATE PROCEDURE add_shop_name()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'wholesale_orders'
      AND column_name  = 'shop_name'
  ) THEN
    ALTER TABLE wholesale_orders ADD COLUMN shop_name VARCHAR(255) NULL;
  END IF;
END //
DELIMITER ;
CALL add_shop_name();
DROP PROCEDURE IF EXISTS add_shop_name;

DROP PROCEDURE IF EXISTS add_shipping_cost;
DELIMITER //
CREATE PROCEDURE add_shipping_cost()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'wholesale_orders'
      AND column_name  = 'shipping_cost'
  ) THEN
    ALTER TABLE wholesale_orders ADD COLUMN shipping_cost DECIMAL(12,2) NULL;
  END IF;
END //
DELIMITER ;
CALL add_shipping_cost();
DROP PROCEDURE IF EXISTS add_shipping_cost;

DROP PROCEDURE IF EXISTS add_admin_note;
DELIMITER //
CREATE PROCEDURE add_admin_note()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'wholesale_orders'
      AND column_name  = 'admin_note'
  ) THEN
    ALTER TABLE wholesale_orders ADD COLUMN admin_note TEXT NULL;
  END IF;
END //
DELIMITER ;
CALL add_admin_note();
DROP PROCEDURE IF EXISTS add_admin_note;

DROP PROCEDURE IF EXISTS add_confirmed_at;
DELIMITER //
CREATE PROCEDURE add_confirmed_at()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'wholesale_orders'
      AND column_name  = 'confirmed_at'
  ) THEN
    ALTER TABLE wholesale_orders ADD COLUMN confirmed_at DATETIME NULL;
  END IF;
END //
DELIMITER ;
CALL add_confirmed_at();
DROP PROCEDURE IF EXISTS add_confirmed_at;

DROP PROCEDURE IF EXISTS add_has_unread_updates;
DELIMITER //
CREATE PROCEDURE add_has_unread_updates()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'wholesale_orders'
      AND column_name  = 'has_unread_updates'
  ) THEN
    ALTER TABLE wholesale_orders ADD COLUMN has_unread_updates TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
END //
DELIMITER ;
CALL add_has_unread_updates();
DROP PROCEDURE IF EXISTS add_has_unread_updates;

-- ── Optional indexes ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_chats_message_type ON chats(message_type);
CREATE INDEX IF NOT EXISTS idx_wholesale_user_id ON wholesale_orders(user_id);

SELECT 'Migration completed successfully.' AS result;
