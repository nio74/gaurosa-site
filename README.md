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

## Per Simone

Leggi il file **[SIMONE.md](./SIMONE.md)** per la guida completa su come lavorare al progetto!

## Team

- **Paolo** - Backend, API, logica
- **Simone** - Frontend, design, UI/UX

---

**Versione**: 0.1.0
**Ultimo aggiornamento**: Gennaio 2026
