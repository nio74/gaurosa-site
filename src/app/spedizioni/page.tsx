'use client';

import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, Package, AlertCircle } from 'lucide-react';

const highlights = [
  {
    icon: Truck,
    title: 'Spedizione Gratuita',
    description: 'Su tutti gli ordini a partire da 45,00 €',
  },
  {
    icon: Clock,
    title: 'Consegna Rapida',
    description: 'In 24/72 ore lavorative in tutta Italia',
  },
  {
    icon: Package,
    title: 'Imballaggio Sicuro',
    description: 'Confezione regalo e garanzia sempre inclusi',
  },
];

export default function SpedizioniPage() {
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
              Spedizioni
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Spedizione gratuita a partire da 45 €. Consegna in 24/72 ore in tutta Italia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-50 rounded-2xl"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-rose text-white rounded-xl mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contenuto */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Costi e Tempi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Spese di Spedizione e Tempi di Consegna
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">
                    Le spedizioni sono <strong className="text-gray-900">gratuite a partire da 45 €</strong>. 
                    Per importi inferiori, il costo della spedizione sarà di <strong className="text-gray-900">5,90 €</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600">
                    La consegna avviene in <strong className="text-gray-900">24/72 ore lavorative</strong>, salvo imprevisti del corriere.
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  Con l&apos;acquisto, vi verrà fornita una data stimata di arrivo del vostro ordine. 
                  Si prega di notare che la data di consegna prevista è da considerare come una previsione 
                  e può essere soggetta a eventi esterni non dipendenti da Gaurosa.
                </p>
                <p className="text-gray-600 text-sm">
                  Il tempo di consegna stimato si basa sulle consegne nelle città capoluogo; per le aree remote, 
                  si dovrà tenere in considerazione un possibile allungamento dei tempi.
                </p>
              </div>
            </motion.div>

            {/* Spedizione Express */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Spedizione Express
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-600">
                  Per una consegna più rapida, è possibile selezionare una spedizione con modalità più espressa. 
                  Queste spedizioni riducono i tempi di consegna, ma non modificano i tempi di preparazione dell&apos;ordine.
                </p>
                <p className="text-gray-600 mt-3 text-sm">
                  In caso di pagamento con bonifico bancario, il tempo di consegna sarà calcolato dal momento 
                  della ricezione del pagamento.
                </p>
              </div>
            </motion.div>

            {/* Controllo Pacco */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Controllo del Pacco
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <p className="text-gray-700">
                  Siete pregati di <strong>controllare il vostro pacco prima di accettare la consegna</strong>. 
                  Se il pacco risulta danneggiato durante il trasporto, rifiutate la consegna e presentate 
                  immediatamente un reclamo al corriere.
                </p>
              </div>
            </motion.div>

            {/* Indirizzo di Consegna */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-gray-500" />
                Indirizzo di Consegna
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
                <p className="text-gray-600">
                  Si prega di specificare correttamente l&apos;indirizzo di consegna. Le consegne possono essere 
                  effettuate solo a domicilio o a indirizzi aziendali.
                </p>
                <p className="text-gray-600 text-sm">
                  Per ordini con un indirizzo diverso da quello di fatturazione, si prega di specificarlo 
                  chiaramente al momento dell&apos;ordine per evitare ritardi nell&apos;elaborazione.
                </p>
                <p className="text-gray-600 text-sm">
                  Dopo l&apos;ordine, per motivi di sicurezza, le informazioni sull&apos;indirizzo di spedizione e di 
                  fatturazione non possono essere modificate. Se non sarete disponibili all&apos;indirizzo fornito, 
                  si prega di contattare il nostro servizio clienti.
                </p>
              </div>
            </motion.div>

            {/* Isole e Estero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Consegna al di Fuori della Terraferma
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-600">
                  Se il vostro indirizzo si trova al di fuori della terraferma, i tempi di consegna potrebbero 
                  essere più lunghi e potrebbero essere applicati dazi doganali. Gaurosa non si assume alcuna 
                  responsabilità per eventuali addebiti aggiuntivi o per il rimborso di tasse o oneri che 
                  potrebbero essere sostenuti dal vostro pacco.
                </p>
              </div>
            </motion.div>

            {/* Tabella Riepilogo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Riepilogo Costi
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-brand-pink-light">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-brand-text">Servizio</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-brand-text">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 text-gray-600">Spedizione standard (ordini &ge; 45 €)</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">Gratuita</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-600">Spedizione standard (ordini &lt; 45 €)</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">5,90 €</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-600">Tempi di consegna</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">24/72 ore</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
