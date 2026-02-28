'use client';

import { motion } from 'framer-motion';
import { Search, ShoppingCart, ClipboardList, CreditCard, Package, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Cerca il tuo gioiello',
    description: 'Sfoglia il nostro catalogo e usa i filtri per trovare il gioiello perfetto per te. Puoi filtrare per categoria, materiale, misura e prezzo.',
    tips: [
      'Usa la barra di ricerca per trovare un prodotto specifico',
      'Filtra per categoria: anelli, bracciali, collane, orecchini',
      'Clicca sul prodotto per vedere foto dettagliate e descrizione',
    ],
  },
  {
    number: 2,
    icon: ShoppingCart,
    title: 'Aggiungi al carrello',
    description: 'Seleziona la misura desiderata e aggiungi il prodotto al carrello. Puoi continuare a fare acquisti o procedere al checkout.',
    tips: [
      'Consulta la nostra Guida alle Misure se non sei sicuro della taglia',
      'Puoi aggiungere più prodotti al carrello',
      'Il carrello viene salvato anche se esci dal sito',
    ],
  },
  {
    number: 3,
    icon: ClipboardList,
    title: 'Inserisci i tuoi dati',
    description: 'Compila i dati di spedizione e fatturazione. Puoi creare un account per salvare i tuoi dati per i prossimi acquisti.',
    tips: [
      'Controlla attentamente l\'indirizzo di spedizione',
      'Inserisci un numero di telefono valido per il corriere',
      'Se hai un codice sconto, inseriscilo in questa fase',
    ],
  },
  {
    number: 4,
    icon: CreditCard,
    title: 'Scegli il pagamento',
    description: 'Seleziona il metodo di pagamento preferito tra carta di credito, PayPal o bonifico bancario.',
    tips: [
      'Tutti i pagamenti sono sicuri e crittografati',
      'Il bonifico richiede 2-3 giorni lavorativi in più',
      'Spedizione gratuita per ordini superiori a 45 €',
    ],
  },
  {
    number: 5,
    icon: Package,
    title: 'Ricevi il tuo ordine',
    description: 'Riceverai una email di conferma con il numero d\'ordine. Il tuo gioiello arriverà in 24/72 ore lavorative in un\'elegante confezione regalo.',
    tips: [
      'Controlla il pacco prima di accettare la consegna',
      'Riceverai il codice di tracciamento via email',
      'Spedizione gratuita per ordini superiori a 45 €',
    ],
  },
];

const faqs = [
  {
    q: 'Posso modificare o annullare un ordine?',
    a: 'Puoi annullare o modificare un ordine entro 1 ora dall\'acquisto contattandoci via email o telefono. Dopo questo termine, l\'ordine potrebbe essere già in preparazione.',
  },
  {
    q: 'Come faccio a tracciare il mio ordine?',
    a: 'Riceverai un\'email con il codice di tracciamento non appena il pacco viene affidato al corriere. Puoi usare il codice sul sito del corriere per seguire la spedizione.',
  },
  {
    q: 'Posso acquistare come regalo?',
    a: 'Sì! Tutti i nostri gioielli vengono spediti in una confezione regalo. Puoi anche richiedere di non includere il prezzo nel pacco.',
  },
  {
    q: 'Cosa succede se il prodotto non mi piace?',
    a: 'Hai 60 giorni di tempo per richiedere un reso o un cambio. Consulta la nostra pagina Resi e Garanzia per tutti i dettagli.',
  },
];

export default function ComeAcquistarePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-rose via-brand-rose-dark to-brand-rose text-white py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Come Acquistare
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Acquistare su Gaurosa è semplice e sicuro. Segui i 5 passaggi e ricevi il tuo gioiello a casa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6"
              >
                {/* Step number + line */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-brand-rose text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand-rose/20 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-brand-rose uppercase tracking-wider">
                      Passo {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>

                  <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                    {step.tips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-brand-rose mt-0.5 flex-shrink-0" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Domande Frequenti</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.q} className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-gray-600 text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-brand-rose text-white rounded-2xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Pronto ad acquistare?</h2>
              <p className="text-white/70 mb-6">
                Scopri la nostra collezione di gioielli artigianali made in Italy.
              </p>
              <Link
                href="/prodotti"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-rose font-medium rounded-xl hover:bg-brand-pink-light transition-colors"
              >
                <Search className="w-4 h-4" />
                Vai al Catalogo
              </Link>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
