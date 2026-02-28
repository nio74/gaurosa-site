# gaurosa-site - Agent Guide

E-commerce statico per gaurosa.it — gioielli artigianali.
Leggi questo file prima di qualsiasi modifica al progetto.

## Stack Tecnico

- **Frontend**: Next.js 16 (static export), Tailwind CSS, Framer Motion, Lucide icons
- **Backend API**: PHP (Hostinger), PHPMailer per email
- **Database**: MySQL su Hostinger (`u341208956_gaurosasito`)
- **Deploy**: Build statica in `out/` → git push → git pull su Hostinger via SSH
- **Dev locale**: `npm run dev` su porta 3003, API PHP proxiate verso XAMPP

## 🚀 Deploy — LEGGERE SEMPRE

### Metodo 1: GUI (per tuo fratello / uso normale)
```
Doppio click su: PUBBLICA SITO.bat
```
Fa tutto da solo: build → commit → push → deploy Hostinger.

### Metodo 2: Manuale (da terminale)
```bash
npm run build                    # genera out/
git add -A
git commit -m "descrizione"
git push origin main
# poi SSH su Hostinger:
# cd /home/u341208956/domains/gaurosa.it/public_html && git pull origin main
```

### Metodo 3: Via AI (chiedi all'AI di deployare)
Di' semplicemente: "fai il deploy" — l'AI usa SSH automaticamente.

### ⚠️ Regole deploy critiche
- **MAI** copiare file manualmente su Hostinger via FTP/cPanel — rompe tutto
- **MAI** modificare file direttamente su Hostinger — vengono sovrascritti al prossimo pull
- Il sito su Hostinger serve i file da `out/` tramite `.htaccess`
- `out/` è committato nel repo (Hostinger non ha Node.js per buildare)
- Dopo ogni `npm run build` i file in `out/` cambiano → vanno committati

## Struttura Progetto

```
gaurosa-site/
├── src/
│   ├── app/                    # Pagine Next.js (App Router)
│   │   ├── page.tsx            # Homepage
│   │   ├── prodotti/           # Catalogo + dettaglio prodotto
│   │   ├── checkout/           # Checkout (Stripe + PayPal)
│   │   ├── account/            # Login, registrazione, ordini
│   │   ├── spedizioni/         # Pagina informativa
│   │   ├── resi/               # Pagina informativa
│   │   ├── guida-misura-anelli/
│   │   ├── metodi-di-pagamento/
│   │   ├── come-acquistare/
│   │   ├── pagamento-sicuro/
│   │   ├── modulo-reso/        # Form → email
│   │   ├── modulo-incisioni/   # Form → email
│   │   └── modulo-cambio-taglia/ # Form → email
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx      # Header rosa con logo immagine
│   │   │   └── Footer.tsx      # Footer bordeaux con logo bianco
│   │   └── MetaPixel.tsx       # Meta Pixel ID: 956053976950592
│   └── hooks/
│       └── useCart.tsx         # Carrello + evento AddToCart
├── api/                        # PHP backend (su Hostinger)
│   ├── config.php              # DB connection + SMTP config
│   ├── contact-form.php        # Form email (reso/incisioni/cambio-taglia)
│   ├── auth/                   # Login, registrazione, JWT
│   ├── checkout/               # Stripe webhook, conferma ordine
│   └── meta-catalog.php        # Feed RSS/XML per Facebook Catalog
├── api-products.php            # Catalogo prodotti (pubblico)
├── api-product.php             # Dettaglio prodotto
├── api-filters.php             # Filtri catalogo
├── api-collections.php         # Collezioni
├── api-sync-*.php              # Sync prodotti da MazGest
├── out/                        # Build statica Next.js (COMMITTATA)
├── public/
│   └── images/
│       ├── logo-gaurosa.png    # Logo 162×80px
│       └── logo-gaurosa@2x.png # Logo retina 324×160px
├── .htaccess                   # Routing Apache: serve out/ direttamente
├── deploy-gui.py               # Script deploy con GUI
├── PUBBLICA SITO.bat           # Doppio click per deployare (Windows)
└── AGENTS.md                   # Questo file
```

## Hostinger — Credenziali SSH

| Campo    | Valore                                              |
|----------|-----------------------------------------------------|
| Host     | `82.25.102.134`                                     |
| Porta    | `65002`                                             |
| Utente   | `u341208956`                                        |
| Password | `cxC~+4Re69`                                        |
| Path     | `/home/u341208956/domains/gaurosa.it/public_html`   |

**Struttura root Hostinger:**
```
public_html/
├── .htaccess          # Routing statico (serve out/)
├── api/               # PHP backend
├── api-*.php          # PHP API pubbliche
├── maintenance.html   # Pagina manutenzione
├── maintenance.json   # Toggle manutenzione {"enabled": false}
├── index.php          # DISABILITATO (index.php.disabled2)
├── uploads/           # Immagini prodotti sincronizzate da MazGest
└── out/               # Build Next.js (aggiornata da git pull)
```

## Database Hostinger

```
Host:     localhost
DB:       u341208956_gaurosasito
User:     u341208956_paolo
Password: 6#KvGR!d
```

Tabelle principali: `products`, `product_images`, `product_variants`,
`collections`, `customers`, `orders`, `order_items`

## Variabili Ambiente

File `.env.production` (NON committato — contiene segreti):
```env
DATABASE_URL="mysql://u341208956_paolo:6%23KvGR%21d@localhost:3306/u341208956_gaurosasito"
MAZGEST_API_URL="https://api.mazgest.org"
MAZGEST_API_KEY="431e0743e76469961f4be3ce724dba991c3f5f3f63aebd6e3ab6fa264062de84"
JWT_SECRET="191c7f0a8982de8ce7a84b0cfea54481a9f33d1b4ac8ddcc516a7fef0993d5e1"
NEXT_PUBLIC_SITE_URL="https://gaurosa.it"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="noreplay@gaurosa.it"
SMTP_PASS="o8rbeNH8["
EMAIL_FROM="noreplay@gaurosa.it"
NEXT_PUBLIC_META_PIXEL_ID=956053976950592
```

⚠️ **NEXT_PUBLIC_*** sono baked nel bundle JS durante la build.
Se cambi `NEXT_PUBLIC_META_PIXEL_ID` devi rifare `npm run build`.

## Comandi Utili

```bash
npm run dev          # Dev server locale (porta 3003)
npm run build        # Build produzione → out/
npm run preview      # Preview build locale
```

## Integrazioni Attive

### Meta Pixel
- ID: `956053976950592`
- Componente: `src/components/MetaPixel.tsx`
- Eventi tracciati: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase

### Facebook Product Catalog
- Feed URL: `https://gaurosa.it/api/meta-catalog.php`
- Formato: RSS/XML (Google Merchant Center)
- Aggiornamento: ogni 24h (programmato in Meta Commerce Manager)

### Pagamenti
- **Stripe**: checkout card, webhook su `api/checkout/stripe-webhook.php`
- **PayPal**: checkout PayPal, conferma su `api/checkout/paypal-confirm.php`
- **Bonifico**: conferma manuale

### Sync Prodotti
- MazGest → Hostinger via `api-sync-products.php`
- Immagini: `api-sync-images.php` (WebP ottimizzate)
- Trigger: dal pannello MazGest (WooCommerce sync)

## Stile e Convenzioni

### Colori Brand
```css
--brand-pink:      #f9c3d5   /* Header background */
--brand-rose:      #8b1538   /* Footer, bottoni primari */
--brand-gold:      #d4a843   /* Accenti */
--brand-text:      #1a1a2e   /* Testo principale */
```

### Nuove Pagine
Seguire il pattern di `src/app/spedizioni/page.tsx`:
- `'use client'` in cima
- Hero con gradient rosa
- Card bianche con shadow
- Framer Motion per animazioni
- Icone Lucide

### Nuove API PHP
Seguire il pattern di `api/contact-form.php`:
- `require_once __DIR__ . '/../api/config.php'`
- CORS headers
- Validazione input
- Try/catch con error_log

## Problemi Noti e Soluzioni

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| Sito lento / non carica | `index.php` attivo | Verificare che `index.php` sia disabilitato |
| Pagine non si aggiornano | Cache browser | Ctrl+F5 / svuota cache |
| Meta Pixel non trovato | Build vecchia | `npm run build` + deploy |
| Deploy manuale via FTP | File misti in root | Usare SOLO `git pull` su Hostinger |
| `git pull` fallisce | Modifiche locali su Hostinger | `git checkout -- .` poi `git pull` |
