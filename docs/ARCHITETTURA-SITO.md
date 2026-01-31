# ARCHITETTURA SITO GAUROSA.IT

## Panoramica

Il sito gaurosa.it utilizza un'architettura ibrida che separa completamente lo sviluppo locale dalla produzione su Hostinger.

**Hostinger NON supporta Node.js runtime** - quindi il sito viene compilato come statico e le API backend sono in PHP.

---

## Ambienti

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
- API routes in `/api/*` funzionano normalmente
- MazGest sincronizza prodotti verso database `gaurosasite`

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
- Sito compilato come STATICO (`output: 'export'`)
- NO Node.js runtime su Hostinger
- API backend in **PHP** (non Next.js API routes)
- Database MySQL su Hostinger (copia manuale tabelle)

---

## Stack Tecnologico

| Componente | Sviluppo Locale | Produzione Hostinger |
|------------|-----------------|----------------------|
| **Frontend** | Next.js 14 (dev mode) | HTML/JS/CSS statico |
| **API** | Next.js API routes | **PHP** |
| **Database** | MySQL XAMPP | MySQL Hostinger |
| **Runtime** | Node.js | Apache (no Node.js) |

---

## Database

### Schema Principale (Prisma)

Il database `gaurosasite` contiene:

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
categories            - Categorie
filter_values         - Valori filtri
sync_logs             - Log sincronizzazione
settings              - Impostazioni
```

### Sincronizzazione Database

**Da locale a Hostinger:**
1. Esporta tabelle da XAMPP: `mysqldump -u root gaurosasite > export.sql`
2. Importa su Hostinger via phpMyAdmin
3. Oppure copia manuale delle tabelle necessarie

**Tabelle da copiare per prima installazione:**
- `products`
- `product_images`
- `product_variants`
- `brands`
- `suppliers`
- `categories`
- `filter_values`

---

## Workflow Sviluppo

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

### 2. Sincronizzazione Prodotti

Da MazGest:
1. Vai a **Gestione Sito Gaurosa**
2. Seleziona prodotti da pubblicare
3. Clicca **Sincronizza**
4. I prodotti vengono salvati nel database `gaurosasite`

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

---

## API Backend

### Sviluppo Locale (Next.js API Routes)

```
/api/products          → GET lista prodotti (da DB locale)
/api/products/[slug]   → GET singolo prodotto
/api/sync/products     → POST riceve prodotti da MazGest
/api/sync/synced-ids   → GET lista ID sincronizzati
```

### Produzione Hostinger (PHP)

Creare file PHP in `public_html/api/`:

```
/api/products.php      → GET lista prodotti
/api/product.php       → GET singolo prodotto
/api/cart.php          → GET/POST carrello
/api/order.php         → POST crea ordine
```

**Esempio `api/products.php`:**

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Connessione database Hostinger
$host = 'localhost';
$dbname = 'u123456789_gaurosasite';
$username = 'u123456789_user';
$password = 'password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);

    // Parametri
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;
    $offset = ($page - 1) * $limit;

    // Query
    $where = "WHERE is_active = 1";
    if ($categoria) {
        $where .= " AND (load_type = :cat OR main_category = :cat)";
    }

    $sql = "SELECT * FROM products $where ORDER BY synced_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    if ($categoria) {
        $stmt->bindValue(':cat', $categoria);
    }
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count totale
    $countSql = "SELECT COUNT(*) FROM products $where";
    $countStmt = $pdo->prepare($countSql);
    if ($categoria) {
        $countStmt->bindValue(':cat', $categoria);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

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

---

## Configurazione Ambienti

### `.env.local` (Sviluppo)

```env
DATABASE_URL="mysql://root:@localhost:3306/gaurosasite"
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### `.env.production` (Produzione)

```env
NEXT_PUBLIC_API_URL=https://gaurosa.it/api
NEXT_PUBLIC_SITE_URL=https://gaurosa.it
# DATABASE_URL non serve - il sito è statico, API sono in PHP
```

---

## next.config.ts

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

## Checklist Deploy

### Prima del Deploy

- [ ] Prodotti sincronizzati nel DB locale
- [ ] Test completo su localhost:3001
- [ ] Verificare immagini prodotti
- [ ] Verificare filtri e ricerca

### Build

```bash
npm run build
# Verifica che non ci siano errori
```

### Deploy

- [ ] Commit e push su GitHub
- [ ] Verificare deploy automatico su Hostinger
- [ ] Testare sito live: https://gaurosa.it

### Post-Deploy

- [ ] Copiare/aggiornare tabelle DB su Hostinger (se necessario)
- [ ] Verificare API PHP funzionanti
- [ ] Test acquisto completo

---

## Troubleshooting

### Errore "output: export" con API routes

**Problema:** In sviluppo le API routes non funzionano

**Soluzione:** Il `next.config.ts` deve avere `output: 'export'` SOLO in produzione:
```typescript
...(isProd && { output: 'export' }),
```

### Prodotti non visualizzati

**Problema:** I prodotti non appaiono sul sito

**Verifiche:**
1. Controllare se prodotti sono nel DB: `SELECT * FROM products WHERE is_active = 1`
2. Verificare API: `http://localhost:3001/api/products`
3. Controllare console browser per errori

### Immagini non caricate

**Problema:** Le immagini prodotti non si vedono

**In sviluppo:** Le immagini sono su MazGest (`localhost:5000/uploads/...`)
**In produzione:** Le immagini devono essere copiate su Hostinger (`gaurosa.it/uploads/...`)

---

## Contatti e Riferimenti

- **Repository:** https://github.com/nio74/gaurosa-site
- **MazGest Docs:** `D:\Development\MazGest\CLAUDE.md`
- **Hostinger Panel:** https://hpanel.hostinger.com

---

**Ultimo aggiornamento:** 30 Gennaio 2026
