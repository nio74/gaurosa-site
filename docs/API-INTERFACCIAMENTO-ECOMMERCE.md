# API INTERFACCIAMENTO E-COMMERCE GAUROSA.IT

## Panoramica Architettura

Il sito gaurosa.it utilizza un'architettura **ibrida** che separa completamente:
- **Sviluppo locale**: Next.js con API routes + XAMPP MySQL
- **Produzione Hostinger**: Sito statico + API PHP + MySQL Hostinger

**IMPORTANTE**: Hostinger **NON supporta Node.js runtime**, quindi:
- Il sito viene compilato come **statico** (`npm run build` → cartella `out/`)
- Le API in produzione sono scritte in **PHP**
- Il deploy avviene via **GitHub** con auto-deploy su Hostinger

---

## Schema Architettura

### SVILUPPO LOCALE

```
┌─────────────────────────────────────────────────────────────┐
│                    PC SVILUPPO                              │
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │  gaurosa-site   │      │    MazGest      │              │
│  │  localhost:3001 │      │  localhost:5000 │              │
│  │  (Next.js dev)  │      │   (Express.js)  │              │
│  └────────┬────────┘      └────────┬────────┘              │
│           │                        │                        │
│           │   SYNC prodotti        │                        │
│           │◄───────────────────────┤                        │
│           │                        │                        │
│           ▼                        ▼                        │
│  ┌─────────────────────────────────────────┐               │
│  │         XAMPP MySQL (localhost)          │               │
│  │                                          │               │
│  │  ┌──────────────┐  ┌──────────────┐     │               │
│  │  │ gaurosasite  │  │   tickets    │     │               │
│  │  │  (sito DB)   │  │ (MazGest DB) │     │               │
│  │  └──────────────┘  └──────────────┘     │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

**Caratteristiche sviluppo locale:**
- `npm run dev` - Next.js con API routes funzionanti
- Database MySQL su XAMPP (porta 3306)
- API routes in `/api/*` funzionano normalmente (Node.js)
- MazGest sincronizza prodotti verso database `gaurosasite`
- Immagini scaricate in `public/uploads/products/`

---

### PRODUZIONE (HOSTINGER)

```
┌─────────────────────────────────────────────────────────────┐
│                      HOSTINGER                              │
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │   Sito Statico  │      │    API PHP      │              │
│  │   (HTML/JS/CSS) │─────►│  /api/*.php     │              │
│  │   gaurosa.it    │      │                 │              │
│  └─────────────────┘      └────────┬────────┘              │
│                                    │                        │
│                                    ▼                        │
│                           ┌─────────────────┐              │
│                           │  MySQL Hostinger │              │
│                           │   (gaurosasite)  │              │
│                           └─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

         ▲
         │ Deploy via GitHub
         │
┌────────┴────────┐
│    GitHub Repo  │
│  gaurosa-site   │
└─────────────────┘
```

**Caratteristiche produzione:**
- Sito compilato come **STATICO** (`output: 'export'`)
- **NO Node.js runtime** su Hostinger
- API backend in **PHP** (non Next.js API routes)
- Database MySQL su Hostinger (copia manuale tabelle)
- Immagini caricate separatamente su Hostinger

---

## Stack Tecnologico

| Componente | Sviluppo Locale | Produzione Hostinger |
|------------|-----------------|----------------------|
| **Frontend** | Next.js 14 (dev mode) | HTML/JS/CSS statico |
| **API** | Next.js API routes (Node.js) | **PHP** |
| **Database** | MySQL XAMPP | MySQL Hostinger |
| **Runtime** | Node.js | Apache (no Node.js) |
| **Immagini** | `public/uploads/products/` | `/uploads/products/` |

---

## API Endpoints

### SVILUPPO LOCALE (Next.js API Routes)

Base URL: `http://localhost:3001/api`

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/products` | Lista prodotti dal database locale |
| GET | `/products/[slug]` | Dettaglio singolo prodotto |
| POST | `/sync/products` | Riceve prodotti da MazGest |
| GET | `/sync/synced-ids` | Lista mazgestId sincronizzati |
| DELETE | `/sync/delete?id=X` | Rimuove singolo prodotto |
| DELETE | `/sync/batch-delete` | Rimuove prodotti multipli |

### PRODUZIONE HOSTINGER (PHP)

Base URL: `https://gaurosa.it/api`

Creare file PHP in `public_html/api/`:

| File | Metodo | Descrizione |
|------|--------|-------------|
| `products.php` | GET | Lista prodotti con paginazione |
| `product.php` | GET | Dettaglio singolo prodotto |
| `cart.php` | GET/POST | Gestione carrello |
| `order.php` | POST | Creazione ordine |
| `customer.php` | POST | Registrazione cliente |

---

## Esempi API PHP per Produzione

### `api/products.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Connessione database Hostinger
$host = 'localhost';
$dbname = 'u123456789_gaurosasite';
$username = 'u123456789_user';
$password = 'password_sicura';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Parametri
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;
    $offset = ($page - 1) * $limit;

    // Query
    $where = "WHERE is_active = 1";
    $params = [];

    if ($categoria) {
        $where .= " AND (load_type = :cat OR main_category = :cat)";
        $params[':cat'] = $categoria;
    }

    // Prodotti
    $sql = "SELECT * FROM products $where ORDER BY synced_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count totale
    $countSql = "SELECT COUNT(*) FROM products $where";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    // Carica immagini per ogni prodotto
    foreach ($products as &$product) {
        $imgStmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
        $imgStmt->execute([$product['id']]);
        $product['images'] = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'products' => $products,
            'pagination' => [
                'total' => (int)$total,
                'pages' => ceil($total / $limit),
                'page' => $page,
                'limit' => $limit
            ]
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Errore database'
    ]);
}
```

### `api/product.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'u123456789_gaurosasite';
$username = 'u123456789_user';
$password = 'password_sicura';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);

    $slug = isset($_GET['slug']) ? $_GET['slug'] : null;

    if (!$slug) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Slug richiesto']);
        exit;
    }

    // Prodotto
    $stmt = $pdo->prepare("SELECT * FROM products WHERE slug = ? AND is_active = 1");
    $stmt->execute([$slug]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Prodotto non trovato']);
        exit;
    }

    // Immagini
    $imgStmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
    $imgStmt->execute([$product['id']]);
    $product['images'] = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

    // Varianti
    $varStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC");
    $varStmt->execute([$product['id']]);
    $product['variants'] = $varStmt->fetchAll(PDO::FETCH_ASSOC);

    // Brand
    if ($product['brand_id']) {
        $brandStmt = $pdo->prepare("SELECT * FROM brands WHERE id = ?");
        $brandStmt->execute([$product['brand_id']]);
        $product['brand'] = $brandStmt->fetch(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'success' => true,
        'data' => $product
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Errore database']);
}
```

### `api/cart.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Inizializza carrello se non esiste
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Ottieni carrello
        echo json_encode([
            'success' => true,
            'data' => [
                'items' => $_SESSION['cart'],
                'total' => array_sum(array_column($_SESSION['cart'], 'subtotal'))
            ]
        ]);
        break;

    case 'POST':
        // Aggiungi al carrello
        $input = json_decode(file_get_contents('php://input'), true);

        $productId = $input['product_id'] ?? null;
        $quantity = $input['quantity'] ?? 1;
        $variantId = $input['variant_id'] ?? null;

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'product_id richiesto']);
            exit;
        }

        // Cerca se prodotto già nel carrello
        $found = false;
        foreach ($_SESSION['cart'] as &$item) {
            if ($item['product_id'] == $productId && $item['variant_id'] == $variantId) {
                $item['quantity'] += $quantity;
                $item['subtotal'] = $item['quantity'] * $item['price'];
                $found = true;
                break;
            }
        }

        if (!$found) {
            // Carica info prodotto dal DB
            // ... (connessione e query)
            $_SESSION['cart'][] = [
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'price' => 0, // Da caricare dal DB
                'subtotal' => 0,
            ];
        }

        echo json_encode(['success' => true, 'data' => $_SESSION['cart']]);
        break;

    case 'DELETE':
        // Svuota carrello
        $_SESSION['cart'] = [];
        echo json_encode(['success' => true, 'message' => 'Carrello svuotato']);
        break;
}
```

---

## Database

### Schema Principale (Prisma → MySQL)

Il database `gaurosasite` contiene le seguenti tabelle:

```
products              - Prodotti sincronizzati da MazGest
product_images        - Immagini prodotti
product_variants      - Varianti (taglie, colori)
brands                - Marchi
suppliers             - Fornitori
customers             - Clienti registrati
orders                - Ordini
order_items           - Righe ordine
carts                 - Carrelli
cart_items            - Righe carrello
```

### Sincronizzazione Database (Locale → Hostinger)

**MANUALE** - Le tabelle vanno copiate manualmente:

1. **Esporta da XAMPP**:
   ```bash
   mysqldump -u root gaurosasite > export.sql
   ```

2. **Importa su Hostinger** via phpMyAdmin

**Tabelle da copiare per prima installazione:**
- `products`
- `product_images`
- `product_variants`
- `brands`
- `suppliers`

**Tabelle da NON copiare** (create vuote su Hostinger):
- `customers` (clienti produzione)
- `orders` (ordini produzione)
- `order_items`
- `carts`
- `cart_items`

---

## Configurazione Ambiente

### `.env.local` (Sviluppo)

```env
DATABASE_URL="mysql://root:@localhost:3306/gaurosasite"
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3001
SYNC_API_KEY=dev-api-key
MAZGEST_IMAGES_URL=http://localhost:5000
```

### `.env.production` (Produzione)

```env
NEXT_PUBLIC_API_URL=https://gaurosa.it/api
NEXT_PUBLIC_SITE_URL=https://gaurosa.it
# DATABASE_URL non serve - il sito è statico, API sono in PHP
```

### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static Export SOLO in produzione (per Hostinger)
  // In sviluppo: API routes funzionano normalmente
  ...(isProd && { output: 'export' }),

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gaurosa.it',
        pathname: '/uploads/**',
      },
    ],
  },

  trailingSlash: true,
};

export default nextConfig;
```

---

## Workflow Deploy

### 1. Sviluppo Locale

```bash
# Avvia gaurosa-site
cd D:\Development\gaurosa-site
npm run dev
# → http://localhost:3001

# Avvia MazGest (per sync prodotti)
cd D:\Development\MazGest\ServerTickets
node index.js
# → http://localhost:5000
```

### 2. Sincronizzazione Prodotti (da MazGest)

1. Vai a **Gestione Sito Gaurosa** in MazGest
2. Seleziona prodotti da pubblicare
3. Clicca **Sincronizza**
4. I prodotti vengono salvati nel database `gaurosasite`
5. Le immagini vengono scaricate in `public/uploads/products/`

### 3. Build per Produzione

```bash
cd D:\Development\gaurosa-site
npm run build
# Genera cartella `out/` con sito statico
```

### 4. Deploy su Hostinger

```bash
git add .
git commit -m "deploy: aggiornamento sito"
git push origin main
# Hostinger fa deploy automatico da GitHub
```

### 5. Post-Deploy

- [ ] Copiare/aggiornare tabelle DB su Hostinger (se necessario)
- [ ] Caricare immagini prodotti su Hostinger
- [ ] Verificare API PHP funzionanti
- [ ] Test sito live: https://gaurosa.it

---

## Gestione Immagini

### Sviluppo Locale
- Immagini scaricate da MazGest durante sync
- Salvate in: `public/uploads/products/{codice_prodotto}/`
- Formato: `img-1.jpg`, `img-2.jpg`, etc.
- URL: `/uploads/products/M00001/img-1.jpg`

### Produzione Hostinger
Le immagini vanno caricate **separatamente** su Hostinger:
1. Copia cartella `public/uploads/products/` via FTP
2. Oppure usa Hostinger File Manager
3. Path su Hostinger: `public_html/uploads/products/`

---

## Troubleshooting

### Errore "output: export" con API routes in sviluppo

**Problema:** In sviluppo le API routes non funzionano

**Soluzione:** Il `next.config.ts` deve avere `output: 'export'` SOLO in produzione:
```typescript
...(isProd && { output: 'export' }),
```

### Prodotti non visualizzati su Hostinger

**Verifiche:**
1. Tabella `products` copiata su database Hostinger?
2. File `api/products.php` presente in `public_html/api/`?
3. Credenziali database corrette nel file PHP?
4. Testare: `https://gaurosa.it/api/products.php`

### Immagini non visibili su Hostinger

**Problema:** Le immagini prodotti non si vedono

**Soluzione:**
1. Verificare che la cartella `uploads/products/` sia stata caricata
2. Controllare permessi cartella (755 per cartelle, 644 per file)
3. Verificare URL immagini nel database corrisponda ai file

### Stock errato dopo sincronizzazione

**Problema:** Lo stock visualizzato non corrisponde ai lotti

**Soluzione:** Verificare che MazGest usi il campo `quantity` dalla tabella `jewelry_product_lots`:
```javascript
const stockFromLots = product.product_lots?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0;
```

---

## Riferimenti

- **Repository sito:** https://github.com/nio74/gaurosa-site
- **MazGest Docs:** `D:\Development\MazGest\CLAUDE.md`
- **Architettura sito:** `docs/ARCHITETTURA-SITO.md`
- **Hostinger Panel:** https://hpanel.hostinger.com

---

**Ultimo aggiornamento:** 30 Gennaio 2026
