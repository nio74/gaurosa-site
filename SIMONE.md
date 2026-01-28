# Guida per Simone - Gaurosa.it

Ciao Simone! Questo documento ti spiega come lavorare sul sito gaurosa.it.

## 🚀 Come Avviare il Progetto

### Prima volta (setup)
```bash
# 1. Clona la repository
git clone https://github.com/nio74/gaurosa-site.git

# 2. Entra nella cartella
cd gaurosa-site

# 3. Installa le dipendenze
npm install

# 4. Copia il file di configurazione
cp .env.example .env.local

# 5. Avvia il server di sviluppo
npm run dev
```

### Ogni volta che lavori
```bash
# 1. Assicurati di essere sul branch giusto
git checkout sviluppo
git pull origin sviluppo

# 2. Avvia il server
npm run dev

# 3. Apri il browser su http://localhost:3000
```

---

## 📁 Struttura Cartelle

```
gaurosa-site/
├── src/
│   ├── app/                    # 📄 PAGINE DEL SITO
│   │   ├── page.tsx            # Homepage
│   │   ├── prodotti/           # Pagina catalogo
│   │   ├── carrello/           # Pagina carrello
│   │   └── checkout/           # Pagina checkout
│   │
│   ├── components/             # 🧩 COMPONENTI RIUTILIZZABILI
│   │   ├── ui/                 # Bottoni, input, card generiche
│   │   ├── layout/             # Header, Footer
│   │   ├── products/           # Card prodotto, griglia prodotti
│   │   ├── cart/               # Componenti carrello
│   │   └── checkout/           # Form checkout
│   │
│   ├── lib/                    # ⚙️ NON TOCCARE (logica API)
│   ├── hooks/                  # ⚙️ NON TOCCARE (logica stato)
│   └── types/                  # Definizioni TypeScript
│
├── public/
│   └── images/                 # 🖼️ IMMAGINI DEL SITO
│
└── .env.local                  # Configurazione (non committare!)
```

---

## ✅ Cosa PUOI Modificare

### 1. **Stili e Design** (la tua area principale!)
- Colori, font, spaziature in tutti i componenti
- Classi Tailwind CSS
- Animazioni con Framer Motion

### 2. **Componenti UI** (`src/components/`)
- Modifica l'aspetto di bottoni, card, form
- Aggiungi nuovi componenti grafici
- Migliora le animazioni

### 3. **Pagine Statiche**
- Chi Siamo (`src/app/chi-siamo/`)
- Contatti (`src/app/contatti/`)
- Privacy, Termini, etc.

### 4. **Immagini** (`public/images/`)
- Aggiungi foto prodotti
- Sostituisci placeholder
- Aggiungi icone/loghi

---

## ❌ Cosa NON Toccare

> **IMPORTANTE**: Questi file contengono la logica di connessione con MazGest.
> Se li modifichi, il sito potrebbe smettere di funzionare!

- `src/lib/mazgest-api.ts` - Connessione API
- `src/hooks/useCart.tsx` - Logica carrello
- `src/types/index.ts` - Definizioni dati
- `.env.local` - Configurazioni segrete

---

## 🎨 Come Modificare gli Stili

### Tailwind CSS
Usiamo Tailwind per gli stili. Esempi:

```jsx
// Colori
<div className="bg-black text-white">       // Sfondo nero, testo bianco
<div className="bg-gray-100 text-gray-900"> // Sfondo grigio chiaro

// Spaziature
<div className="p-4">     // Padding 16px
<div className="mt-8">    // Margin top 32px
<div className="gap-6">   // Gap tra elementi 24px

// Responsive
<div className="text-sm md:text-lg lg:text-xl">
// Piccolo su mobile, medio su tablet, grande su desktop
```

### Animazioni con Framer Motion
```jsx
import { motion } from 'framer-motion';

// Fade in dal basso
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenuto animato
</motion.div>

// Hover scale
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Cliccami
</motion.button>
```

---

## 📝 Workflow Git

### Quando hai finito di lavorare:
```bash
# 1. Vedi cosa hai modificato
git status

# 2. Aggiungi le modifiche
git add .

# 3. Crea un commit con messaggio descrittivo
git commit -m "Aggiunto stile hero section homepage"

# 4. Pusha su GitHub
git push origin sviluppo
```

### Messaggi commit consigliati:
- `feat: aggiunta animazione card prodotti`
- `style: migliorati colori header`
- `fix: corretto layout mobile footer`

---

## 🖼️ Come Aggiungere Immagini

1. Metti l'immagine in `public/images/`
2. Usala nel codice così:

```jsx
import Image from 'next/image';

<Image
  src="/images/nome-immagine.jpg"
  alt="Descrizione"
  width={400}
  height={300}
/>
```

---

## ❓ Problemi Comuni

### "npm run dev non funziona"
```bash
# Prova a reinstallare le dipendenze
rm -rf node_modules
npm install
npm run dev
```

### "Errore TypeScript"
Non preoccuparti degli errori rossi se il sito funziona.
Chiedi a Paolo se sono bloccanti.

### "Git dice che ci sono conflitti"
```bash
# Salva le tue modifiche
git stash

# Aggiorna dal remoto
git pull origin sviluppo

# Riapplica le tue modifiche
git stash pop
```

---

## 📞 Contatti

Se hai dubbi, chiedi a **Paolo** prima di fare modifiche importanti!

---

**Buon lavoro! 🎨**
