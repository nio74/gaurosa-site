'use client';

import { motion } from 'framer-motion';
import { RotateCcw, Shield, Scissors, Wrench, Mail, Phone, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'recesso', label: 'Diritto di Recesso', icon: RotateCcw },
  { id: 'garanzia', label: 'Garanzia', icon: Shield },
  { id: 'incisione', label: 'Incisione', icon: Scissors },
  { id: 'misure', label: 'Modifica Misure', icon: Wrench },
  { id: 'riparazioni', label: 'Riparazioni', icon: Wrench },
];

export default function ResiPage() {
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
              Resi e Garanzia
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              60 giorni per il reso, garanzia gratuita su tutti i prodotti. 
              La tua soddisfazione è la nostra priorità.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="py-8 bg-white border-b sticky top-16 lg:top-20 z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-pink-light text-brand-text text-sm font-medium rounded-full hover:bg-brand-pink transition-colors"
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contenuto */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-16">

            {/* Recesso */}
            <motion.div
              id="recesso"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Diritto di Recesso</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Hai tempo <strong>60 giorni</strong> dalla consegna per concordare un reso.
                  </p>
                </div>

                <p className="text-gray-600">
                  È possibile restituire il tuo gioiello a Gaurosa di Mazzon Gioielli S.N.C. sia per un 
                  <strong> rimborso</strong> che per un <strong>cambio gioiello</strong>. Tutto quello che vi chiediamo 
                  è di compilare il nostro modulo recesso e includere una copia stampata nel pacchetto di ritorno.
                </p>

                <p className="text-gray-600 text-sm">
                  Una e-mail di conferma, incluso l&apos;indirizzo di ritorno e una copia del modulo compilato, 
                  verrà inviata al tuo indirizzo di posta elettronica dopo aver inviato il modulo di reso.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm font-medium">
                    Il costo della spedizione di ritorno del reso è a carico del cliente.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Indirizzo per i resi:</p>
                  <p className="text-sm text-gray-600">
                    GAUROSA di Mazzon Gioielli S.N.C.<br />
                    Via Don G. Carrara, 19<br />
                    35010 Villa del Conte (PD)<br />
                    Italia
                  </p>
                </div>

                <h3 className="font-semibold text-gray-900 mt-6">Condizioni per il rimborso completo:</h3>
                <ul className="space-y-2">
                  {[
                    'L\'oggetto non è stato indossato e non presenta alcun segno di utilizzo',
                    'Il prodotto deve essere restituito completo di tutti gli elementi complementari (confezione regalo, certificazioni, articoli promozionali)',
                    'Il prodotto non è un ordine speciale personalizzato e/o realizzato su specifiche del cliente',
                    'Il prodotto è stato restituito entro 60 giorni dalla consegna',
                  ].map((condition, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {condition}
                    </li>
                  ))}
                </ul>

                <p className="text-gray-600 text-sm">
                  Il rimborso verrà accreditato sul metodo di pagamento originale, esclusi i costi di spedizione. 
                  Può richiedere fino a 10 giorni lavorativi.
                </p>
              </div>
            </motion.div>

            {/* Garanzia */}
            <motion.div
              id="garanzia"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Garanzia</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <p className="text-gray-600">
                  I gioielli Gaurosa sono prodotti con cura e materiali di qualità. Tutti i prodotti Gaurosa 
                  sono forniti con una <strong>garanzia gratuita</strong>. In caso di qualsiasi difetto di fabbricazione, 
                  Gaurosa sarà lieta di riparare il vostro articolo gratuitamente.
                </p>

                <h3 className="font-semibold text-gray-900">Termini e Condizioni della Garanzia:</h3>
                <ol className="space-y-2 list-decimal list-inside">
                  {[
                    'La garanzia è ammissibile solo per difetti di fabbricazione e non copre deformazioni e danni causati da incidenti, uso improprio, negligenza o normale usura.',
                    'Il prodotto sarà considerato fuori garanzia se modificato da terzi (incisione, ridimensionamento o riparazione da parte di un altro gioielliere).',
                    'Se una parte del gioiello cade, deve essere restituita insieme alle sue parti prima di qualsiasi tentativo di riparazione.',
                    'La garanzia non è trasferibile a terzi.',
                  ].map((term, i) => (
                    <li key={i} className="text-sm text-gray-600">{term}</li>
                  ))}
                </ol>

                <h3 className="font-semibold text-gray-900 mt-4">La garanzia NON copre:</h3>
                <ul className="space-y-1">
                  {[
                    'Scoloramento dovuto a prodotti chimici, trucco, piscine o bagno',
                    'Graffi, ammaccature o scheggiature da usura o utilizzo improprio',
                    'Pietre perse o rubate',
                    'Articoli usurati oltre le aspettative di normale usura quotidiana',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-400 mt-0.5">&#x2715;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Incisione */}
            <motion.div
              id="incisione"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Incisione</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <p className="text-gray-600">
                  Se hai ordinato il tuo articolo senza incisione e in seguito hai deciso che vorresti farlo incidere, 
                  lo faremo volentieri con un costo aggiuntivo di <strong className="text-gray-900">20,00 €</strong> (spedizione inclusa).
                </p>
                <p className="text-gray-600 text-sm">
                  L&apos;incisione di un oggetto non invalida la garanzia. Evita di far incidere il tuo articolo 
                  da terzi poiché invaliderà la garanzia.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Il processo di incisione richiede circa <strong>25 giorni lavorativi</strong> a seconda del prodotto.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Modifica Misure */}
            <motion.div
              id="misure"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Modifica Misure</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Prima modifica misura gratuita entro 60 giorni dal ricevimento.
                  </p>
                </div>
                <p className="text-gray-600">
                  Gaurosa sarà lieta di modificare la misura dell&apos;anello una sola volta gratuitamente 
                  entro i primi 60 giorni dal ricevimento del prodotto.
                </p>
                <p className="text-gray-600 text-sm">
                  I prodotti personalizzati non sono idonei per il ridimensionamento gratuito. 
                  Gli anelli possono essere modificati solo nell&apos;ambito delle dimensioni offerte sul sito. 
                  La larghezza o lo spessore di un anello non possono essere modificati.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Il processo di modifica misura richiede circa <strong>10 giorni lavorativi</strong>. 
                    Un anello modificato non sarà idoneo per un rimborso.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Riparazioni */}
            <motion.div
              id="riparazioni"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Riparazioni</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <p className="text-gray-600">
                  Per la restituzione di un prodotto da riparare, compilare il modulo reso riparazione 
                  e seguire la procedura illustrata nella sezione Resi.
                </p>
                <p className="text-gray-600 text-sm">
                  Assicurati di inviare il tuo prodotto per la riparazione senza gli elementi complementari 
                  come la confezione regalo o i certificati poiché questi articoli non saranno restituiti 
                  dopo il processo di riparazione.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Il processo di riparazione richiede circa <strong>10 giorni lavorativi</strong> a seconda del prodotto.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contatti */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-brand-rose text-white rounded-2xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Hai bisogno di assistenza?</h2>
              <p className="text-white/70 mb-6">
                Non esitare a contattarci per qualsiasi domanda su resi, garanzia o riparazioni.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@gaurosa.it"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-rose font-medium rounded-xl hover:bg-brand-pink-light transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@gaurosa.it
                </a>
                <a
                  href="tel:+390499390535"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +39 049 939 0535
                </a>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
