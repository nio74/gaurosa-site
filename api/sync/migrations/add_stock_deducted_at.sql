-- ============================================================
-- Migration: aggiunge orders.stock_deducted_at per idempotenza decremento stock
--
-- Senza questo flag, se il webhook Stripe e confirm-order arrivano entrambi
-- (oppure update-order-status.php viene chiamato due volte), lo stock
-- verrebbe decrementato più volte. Con questo timestamp deductOrderStock()
-- ritorna early se è già stato eseguito.
--
-- Eseguire su:
--   - XAMPP locale: DB `gaurosasite`
--   - Hostinger:    DB `u341208956_gaurosasito`
--
-- Sicuro da rieseguire (controllo IF NOT EXISTS via INFORMATION_SCHEMA).
-- ============================================================

SET @col_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'stock_deducted_at'
);

SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE orders ADD COLUMN stock_deducted_at DATETIME(3) NULL AFTER paid_at',
    'SELECT "Column stock_deducted_at already exists, skipping" AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Backfill: marca tutti gli ordini storici "paid" come già decrementati.
--
-- Senza questo passaggio, un eventuale replay di webhook Stripe storico
-- (es. payment_intent.succeeded per un vecchio ordine) farebbe scattare un
-- doppio decremento di stock perché il check di idempotenza vedrebbe NULL.
--
-- Logica: tutti gli ordini con payment_status='paid' al momento della migration
-- sono ASSUNTI come già decrementati in passato. Battezziamo stock_deducted_at
-- con paid_at (o updated_at come fallback). Non tocca ordini pending — quelli
-- decrementeranno regolarmente quando arriverà la conferma di pagamento.
--
-- Sicuro da rieseguire (WHERE stock_deducted_at IS NULL).
-- ============================================================

UPDATE orders
SET stock_deducted_at = COALESCE(paid_at, updated_at, NOW(3))
WHERE payment_status = 'paid'
  AND stock_deducted_at IS NULL;

