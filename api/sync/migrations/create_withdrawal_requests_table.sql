-- Tabella richieste di recesso (art. 54-bis Cod. Consumo, D.Lgs. 209/2025)
-- Additiva: nessun impatto su tabelle/dati esistenti.
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_id INT NULL,
    items TEXT NULL,
    declaration_text TEXT NOT NULL,
    received_at DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ricevuto',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wr_order (order_number),
    INDEX idx_wr_email (customer_email),
    INDEX idx_wr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
