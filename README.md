# Gaurosa.it - E-commerce Gioielli e Orologi

Sito e-commerce per Gaurosa, realizzato con Next.js 14 e connesso al gestionale MazGest.

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animazioni**: Framer Motion
- **Icone**: Lucide React
- **Backend**: API MazGest (`/ecommerce/*`)
- **Pagamenti**: Stripe (da configurare)

## Requisiti

- Node.js 18+
- npm o yarn
- Accesso all'API MazGest

## Installazione

```bash
# Clona la repository
git clone https://github.com/nio74/gaurosa-site.git
cd gaurosa-site

# Installa dipendenze
npm install

# Configura ambiente
cp .env.example .env.local
# Modifica .env.local con i valori corretti

# Avvia sviluppo
npm run dev
```

## Struttura Progetto

```
src/
├── app/                    # Pagine (App Router)
│   ├── page.tsx           # Homepage
│   ├── prodotti/          # Catalogo prodotti
│   ├── carrello/          # Carrello
│   └── checkout/          # Checkout
├── components/
│   ├── ui/                # Componenti UI base
│   ├── layout/            # Header, Footer
│   ├── products/          # Componenti prodotti
│   └── cart/              # Componenti carrello
├── lib/
│   ├── mazgest-api.ts     # Client API MazGest
│   └── utils.ts           # Utility functions
├── hooks/
│   └── useCart.tsx        # Gestione carrello
└── types/
    └── index.ts           # TypeScript types
```

## Branches

- `main` - Produzione (deploy automatico su Hostinger)
- `sviluppo` - Sviluppo e test

## Workflow

1. Lavora sempre sul branch `sviluppo`
2. Testa le modifiche in locale
3. Quando pronto, fai merge su `main`
4. Il deploy su Hostinger è automatico

## API MazGest

Il sito comunica con MazGest tramite gli endpoint `/ecommerce/*`:

| Endpoint | Descrizione |
|----------|-------------|
| `GET /products` | Lista prodotti |
| `GET /products/:code` | Dettaglio prodotto |
| `GET /stock/:code` | Stock in tempo reale |
| `POST /orders` | Crea ordine |
| `GET /categories` | Lista categorie |
| `GET /brands` | Lista brand |

## Variabili Ambiente

```env
NEXT_PUBLIC_MAZGEST_API_URL=https://api.mazgest.org
MAZGEST_API_KEY=your-api-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

## Scripts

```bash
npm run dev      # Sviluppo locale
npm run build    # Build produzione
npm run start    # Avvia produzione
npm run lint     # Linting
```

## Deploy su Hostinger

### 1. Collega Repository Git

1. Vai su **Hostinger → Hosting → Gestisci**
2. Sezione **Git** o **Avanzate → Git**
3. Collega repository: `https://github.com/nio74/gaurosa-site`
4. Branch: `main`

### 2. Configura Build

| Campo | Valore |
|-------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Node Version** | `18` o superiore |

### 3. Variabili Ambiente

In **Hostinger → Environment Variables**, aggiungi:

```
NEXT_PUBLIC_MAZGEST_API_URL=https://api.mazgest.org
MAZGEST_API_KEY=chiedi-a-paolo
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
DATABASE_URL=mysql://user:pass@localhost:3306/gaurosa_db
CRON_SECRET=genera-stringa-random
NEXT_PUBLIC_SITE_URL=https://gaurosa.it
```

### 4. Database MySQL

1. **Hostinger → Database → Crea nuovo database**
2. Nome: `gaurosa_db`
3. Copia credenziali in `DATABASE_URL`

### 5. Cron Job (Sync Prodotti)

1. **Hostinger → Avanzate → Cron Jobs**
2. Comando: `curl -H "Authorization: Bearer TUO_CRON_SECRET" https://gaurosa.it/api/cron/sync`
3. Frequenza: Ogni 5 minuti (`*/5 * * * *`)

---

## Per Simone

Leggi il file **[SIMONE.md](./SIMONE.md)** per la guida completa su come lavorare al progetto!

## Team

- **Paolo** - Backend, API, logica
- **Simone** - Frontend, design, UI/UX

---

**Versione**: 0.1.0
**Ultimo aggiornamento**: Gennaio 2026
