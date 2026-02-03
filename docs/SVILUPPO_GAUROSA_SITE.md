# Guida Sviluppo gaurosa.it

**Ultimo aggiornamento**: 3 Febbraio 2026

Questa guida spiega come sviluppare e deployare il sito e-commerce gaurosa.it.

---

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  - React per componenti UI                                  │
│  - Tailwind CSS per stili                                   │
│  - Framer Motion per animazioni                             │
│  - Build genera HTML/CSS/JS STATICI                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ fetch() HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (PHP)                            │
│  - API REST in /api/*.php                                   │
│  - Connessione MySQL diretta                                │
│  - Autenticazione JWT                                       │
│  - Hostinger NON supporta Node.js → PHP obbligatorio        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                         │
│  - Locale: gaurosasite (XAMPP)                              │
│  - Produzione: u341208956_gaurosasito (Hostinger)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Struttura Progetto

```
gaurosa-site/
├── src/                    # Codice Frontend (Next.js/React)
│   ├── app/                # Pagine (App Router)
│   │   ├── page.tsx        # Homepage
│   │   ├── prodotti/       # Catalogo prodotti
│   │   ├── carrello/       # Carrello
│   │   └── layout.tsx      # Layout principale
│   ├── components/         # Componenti React riutilizzabili
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   │   └── api.ts          # Client API (chiama PHP)
│   └── types/              # TypeScript types
│
├── api/                    # Backend PHP (API REST)
│   ├── config.php          # Configurazione DB e funzioni comuni
│   ├── products.php        # GET /api/products.php - Lista prodotti
│   ├── product.php         # GET /api/product.php?code=X - Dettaglio
│   ├── auth/               # Autenticazione
│   │   ├── login.php
│   │   ├── register.php
│   │   └── me.php
│   └── sync/               # API sincronizzazione da MazGest
│
├── public/                 # Asset statici
├── prisma/                 # Schema database (riferimento)
├── docs/                   # Documentazione
└── out/ o dist/            # Output build (generato)
```

---

## Ambiente di Sviluppo

### Prerequisiti

1. **Node.js 18+** - Per il frontend Next.js
2. **XAMPP** - Per PHP e MySQL locale
3. **Git** - Versionamento

### Setup Iniziale

```bash
# 1. Clona il repository
git clone <repo-url> gaurosa-site
cd gaurosa-site

# 2. Installa dipendenze Node.js
npm install

# 3. Copia .env.example in .env.local
cp .env.example .env.local

# 4. Avvia XAMPP (Apache + MySQL)
# - Apri XAMPP Control Panel
# - Start Apache
# - Start MySQL

# 5. Crea database locale
# - Apri phpMyAdmin: http://localhost/phpmyadmin
# - Crea database: gaurosasite
# - Importa schema da prisma/migrations o esegui prisma db push

# 6. Crea symlink per API PHP (richiede terminale Admin)
# Crea cartella in htdocs se non esiste
mkdir C:\xampp\htdocs\gaurosa-site

# Crea symlink (esegui come Amministratore!)
mklink /D C:\xampp\htdocs\gaurosa-site\api D:\Development\gaurosa-site\api
```

### Symlink API

Le API PHP sono in `D:\Development\gaurosa-site\api\` ma XAMPP serve da `C:\xampp\htdocs\`.

Il **symlink** collega le due cartelle:
```
C:\xampp\htdocs\gaurosa-site\api\ → D:\Development\gaurosa-site\api\
```

Così ogni modifica ai file PHP in Development è **immediatamente** disponibile su XAMPP.

**Per ricreare il symlink** (se perso):
```cmd
# Esegui come Amministratore
rmdir C:\xampp\htdocs\gaurosa-site\api
mklink /D C:\xampp\htdocs\gaurosa-site\api D:\Development\gaurosa-site\api
```

### Workflow Sviluppo Quotidiano

```bash
# 1. Avvia XAMPP (Apache + MySQL)

# 2. Avvia frontend Next.js
cd D:\Development\gaurosa-site
npm run dev

# Frontend: http://localhost:3001
# API PHP:  http://localhost/gaurosa-site/api/
```

### Come Funziona

1. **Next.js** gira su `http://localhost:3001`
2. **XAMPP/Apache** serve le API PHP su `http://localhost/gaurosa-site/api/`
3. Il frontend chiama le API PHP (es: `http://localhost/gaurosa-site/api/products.php`)
4. Le API PHP leggono/scrivono su MySQL locale (`gaurosasite`)

### CORS

Il file `api/config.php` gestisce i CORS e permette richieste da:
- `http://localhost:3001` (sviluppo)
- `https://gaurosa.it` (produzione)

---

## API Disponibili

### Prodotti

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/products.php` | GET | Lista prodotti con filtri |
| `/api/products.php?categoria=gioielli` | GET | Filtro per categoria |
| `/api/products.php?sottocategoria=bracciale` | GET | Filtro per sottocategoria |
| `/api/products.php?search=anello` | GET | Ricerca |
| `/api/products.php?limit=20&offset=0` | GET | Paginazione |
| `/api/product.php?code=ABC123` | GET | Dettaglio singolo prodotto |

### Autenticazione

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/auth/login.php` | POST | Login (email, password) |
| `/api/auth/register.php` | POST | Registrazione |
| `/api/auth/logout.php` | POST | Logout |
| `/api/auth/me.php` | GET | Dati utente corrente |

### Sincronizzazione (da MazGest)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/sync/products.php` | POST | Sync prodotti |
| `/api/sync/categories.php` | POST | Sync categorie |
| `/api/sync/tags.php` | POST | Sync tags |

---

## Deploy su Hostinger

### Procedura

1. **Build del frontend**
   ```bash
   npm run build
   ```
   Genera file statici in `out/` o `dist/`

2. **Commit e push**
   ```bash
   git add .
   git commit -m "Descrizione modifiche"
   git push origin main
   ```

3. **Deploy su Hostinger**
   - Vai su [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Seleziona gaurosa.it
   - Git → Deploy

4. **Verifica**
   - Apri https://gaurosa.it
   - Testa le pagine principali
   - Verifica API: https://gaurosa.it/api/products.php

### Database Hostinger

Il database Hostinger **NON** si sincronizza automaticamente con quello locale!

Se modifichi lo schema:
1. Testa in locale
2. Esporta le query SQL (CREATE TABLE, ALTER TABLE)
3. Esegui manualmente su Hostinger via phpMyAdmin

Vedi `DEPLOY_HOSTINGER.md` per query SQL delle tabelle.

---

## Credenziali

### Database Locale (XAMPP)
- Host: `localhost`
- Database: `gaurosasite`
- User: `root`
- Password: (vuota)

### Database Hostinger
- Host: `localhost`
- Database: `u341208956_gaurosasito`
- User: `u341208956_paolo`
- Password: `6#KvGR!d`

### SSH Hostinger
- Host: `82.25.102.134`
- Porta: `65002`
- User: `u341208956`
- Password: `cxC~+4Re69`

---

## Sincronizzazione Prodotti

I prodotti vengono sincronizzati da **MazGest** (gestionale) a **gaurosa.it** (e-commerce).

### Da MazGest

```bash
cd D:\Development\MazGest\ServerTickets
node scripts/syncToGaurosa.js
```

### Cosa viene sincronizzato

- Prodotti con categoria `gioielli` e stato `attivo`
- Immagini (URL da api.mazgest.org)
- Varianti (taglie)
- Attributi (materiale, pietre, misure)
- Tags (novita, offerta, fatto_a_mano)
- Stock

---

## Troubleshooting

### API non risponde in locale

1. Verifica che XAMPP sia avviato (Apache + MySQL)
2. Controlla che il progetto sia in `C:\xampp\htdocs\gaurosa-site\`
3. Testa: `http://localhost/gaurosa-site/api/products.php`

### Errore CORS

Il frontend su porta 3001 non riesce a chiamare XAMPP su porta 80:
- Verifica che `api/config.php` includa `http://localhost:3001` negli allowed origins
- Riavvia Apache dopo modifiche a config.php

### Prodotti non visibili

1. Verifica database: `SELECT COUNT(*) FROM products`
2. Verifica stock: `SELECT COUNT(*) FROM products WHERE stock > 0`
3. Esegui sync da MazGest

### Build fallisce

```bash
# Pulisci cache
rm -rf .next node_modules
npm install
npm run build
```

---

## Best Practices

1. **Testa sempre in locale** prima di pushare
2. **Mai modificare direttamente** il database Hostinger senza backup
3. **Usa feature branch** per modifiche grandi
4. **Documenta** le modifiche al database in questo file

---

## File Importanti

| File | Descrizione |
|------|-------------|
| `api/config.php` | Configurazione DB, CORS, funzioni comuni |
| `src/lib/api.ts` | Client API frontend (chiama PHP) |
| `prisma/schema.prisma` | Schema database (riferimento) |
| `DEPLOY_HOSTINGER.md` | Guida deploy e query SQL |
| `docs/SVILUPPO_GAUROSA_SITE.md` | Questa guida |
