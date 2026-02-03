# Deploy gaurosa.it su Hostinger

**Ultimo aggiornamento**: 3 Febbraio 2026

Questa guida documenta tutti i passaggi per deployare il sito gaurosa.it su Hostinger.

---

## Prerequisiti

- Accesso al pannello Hostinger
- Accesso SSH (opzionale ma consigliato)
- Database locale `gaurosasite` sincronizzato con prodotti

---

## Credenziali

### Database Hostinger
- **Host**: `localhost`
- **Database**: `u341208956_gaurosasito`
- **User**: `u341208956_paolo`
- **Password**: `6#KvGR!d`

### Accesso SSH
- **Host**: `82.25.102.134`
- **Porta**: `65002`
- **Utente**: `u341208956`
- **Password**: `cxC~+4Re69`
- **Comando**: `ssh u341208956@82.25.102.134 -p 65002`

### SMTP Email
- **Host**: `smtp.hostinger.com`
- **Porta**: `465`
- **User**: `noreplay@gaurosa.it`
- **Password**: `o8rbeNH8[`

---

## Procedura Deploy

### 1. Build del Sito (Locale)

```bash
cd D:\Development\gaurosa-site
npm run build
```

Questo genera la cartella `out/` con i file statici.

### 2. Commit e Push

```bash
git add .
git commit -m "Deploy: descrizione modifiche"
git push origin main
```

### 3. Deploy su Hostinger

1. Vai su [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Seleziona il sito `gaurosa.it`
3. Vai in **Git** → **Deploy**
4. Clicca **Deploy** per sincronizzare con il repository

### 4. Verifica Online

- Apri https://gaurosa.it
- Verifica che le pagine si carichino
- Testa le API: https://gaurosa.it/api/products.php

---

## Aggiornamento Database Hostinger

⚠️ **IMPORTANTE**: Il database Hostinger NON si sincronizza automaticamente!

### Tabelle Richieste

Le tabelle necessarie per il sito sono:

```
products           - Prodotti principali
product_images     - Immagini prodotti
product_variants   - Varianti (taglie, misure)
brands             - Marchi
suppliers          - Fornitori
categories         - Categorie
tags               - Tag prodotti (novita, offerta, etc.)
product_tags       - Relazione prodotto-tag
attributes         - Attributi filtrabili
attribute_values   - Valori attributi
customers          - Clienti registrati
orders             - Ordini
order_items        - Righe ordine
```

### Verificare Tabelle Mancanti

1. Vai su **phpMyAdmin** nel pannello Hostinger
2. Seleziona database `u341208956_gaurosasito`
3. Confronta con le tabelle locali in `gaurosasite`

Oppure chiama l'API di verifica:
```
https://gaurosa.it/api/sync/check-schema.php
```

### Creare Tabelle Mancanti

Se mancano tabelle, esegui le query SQL. Ecco le più importanti:

#### Tabella `tags`
```sql
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    product_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_type (type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tabella `product_tags`
```sql
CREATE TABLE IF NOT EXISTS product_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tag_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_tag (product_id, tag_id),
    INDEX idx_product (product_id),
    INDEX idx_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tabella `product_variants`
```sql
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    mazgest_variant_id INT,
    sku VARCHAR(100),
    name VARCHAR(100),
    attribute_name VARCHAR(50),
    attribute_value VARCHAR(50),
    is_virtual BOOLEAN DEFAULT FALSE,
    parent_variant_id INT,
    price DECIMAL(10,2),
    stock INT DEFAULT 0,
    INDEX idx_product (product_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tabella `brands`
```sql
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mazgest_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tabella `suppliers`
```sql
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mazgest_id INT UNIQUE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Aggiungere Colonne Mancanti a `products`

Se la tabella `products` esiste ma mancano colonne:

```sql
-- Colonne per attributi gioielli
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS material_primary VARCHAR(50),
ADD COLUMN IF NOT EXISTS material_color VARCHAR(30),
ADD COLUMN IF NOT EXISTS material_weight_grams DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS stone_main_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stone_main_carats DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS stone_main_color VARCHAR(30),
ADD COLUMN IF NOT EXISTS stone_main_clarity VARCHAR(10),
ADD COLUMN IF NOT EXISTS stone_main_cut VARCHAR(30),
ADD COLUMN IF NOT EXISTS stone_main_certificate VARCHAR(100),
ADD COLUMN IF NOT EXISTS stones_secondary_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stones_secondary_count INT,
ADD COLUMN IF NOT EXISTS pearl_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS pearl_size_mm DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS pearl_color VARCHAR(30),
ADD COLUMN IF NOT EXISTS size_ring_it INT,
ADD COLUMN IF NOT EXISTS size_bracelet_cm DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS size_necklace_cm INT,
ADD COLUMN IF NOT EXISTS size_earring_mm DECIMAL(5,1),
ADD COLUMN IF NOT EXISTS ring_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS ring_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS earring_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS bracelet_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS necklace_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS pendant_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS item_condition VARCHAR(20) DEFAULT 'nuovo',
ADD COLUMN IF NOT EXISTS brand_id INT,
ADD COLUMN IF NOT EXISTS supplier_id INT;
```

---

## Sincronizzazione Prodotti

Dopo aver aggiornato lo schema del database, sincronizza i prodotti da MazGest:

### Dal Backend MazGest

```bash
cd D:\Development\MazGest\ServerTickets
node scripts/syncToGaurosa.js
```

### Verifica Sync

Controlla che i prodotti siano presenti:
```
https://gaurosa.it/api/products.php
```

---

## API Disponibili

### Lista Prodotti
```
GET /api/products.php
GET /api/products.php?categoria=gioielli
GET /api/products.php?sottocategoria=bracciale
GET /api/products.php?limit=20&offset=0
```

### Dettaglio Prodotto
```
GET /api/product.php?code=CODICE_PRODOTTO
```

### Verifica Schema
```
GET /api/sync/check-schema.php
```

---

## Troubleshooting

### Errore "Table doesn't exist"
- Crea la tabella mancante con le query SQL sopra

### Prodotti non visibili
1. Verifica che ci siano prodotti nel DB: `SELECT COUNT(*) FROM products`
2. Controlla lo stock: `SELECT COUNT(*) FROM products WHERE stock > 0`
3. Verifica categoria: `SELECT DISTINCT main_category, subcategory FROM products`

### Immagini non caricate
- Le immagini sono su server MazGest
- URL formato: `https://api.mazgest.org/images/products/...`
- Verifica che il server MazGest sia online

### Errore CORS
- Le API PHP hanno già gli header CORS configurati
- Verifica che `config.php` includa il dominio corretto

---

## Checklist Deploy

- [ ] `npm run build` completato senza errori
- [ ] Commit e push effettuato
- [ ] Deploy su Hostinger eseguito
- [ ] Schema database verificato/aggiornato
- [ ] API products funzionante
- [ ] API product detail funzionante
- [ ] Pagina prodotti carica i dati
- [ ] Pagina dettaglio prodotto funziona
- [ ] Immagini visibili

---

## Note

- **Hostinger NON supporta Node.js runtime** - tutte le API devono essere in PHP
- Il build Next.js genera HTML statico, le route API non funzionano
- Le API PHP in `/api/` funzionano direttamente
- I dati vengono da MySQL, non da API Next.js
