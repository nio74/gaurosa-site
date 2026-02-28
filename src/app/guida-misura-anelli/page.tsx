'use client';

import { motion } from 'framer-motion';
import { Ruler, Circle, Info, ChevronRight, Link as LinkIcon, Play } from 'lucide-react';
import Link from 'next/link';

const ringTable = [
  { it: '6',  diam: '14,0', circ: '44,0' },
  { it: '7',  diam: '14,4', circ: '45,1' },
  { it: '8',  diam: '14,8', circ: '46,5' },
  { it: '9',  diam: '15,2', circ: '47,8' },
  { it: '10', diam: '15,6', circ: '49,0' },
  { it: '11', diam: '16,0', circ: '50,3' },
  { it: '12', diam: '16,5', circ: '51,8' },
  { it: '13', diam: '16,9', circ: '53,1' },
  { it: '14', diam: '17,3', circ: '54,4' },
  { it: '15', diam: '17,7', circ: '55,7' },
  { it: '16', diam: '18,2', circ: '57,2' },
  { it: '17', diam: '18,6', circ: '58,4' },
  { it: '18', diam: '19,0', circ: '59,7' },
  { it: '19', diam: '19,4', circ: '61,0' },
  { it: '20', diam: '19,8', circ: '62,2' },
  { it: '21', diam: '20,2', circ: '63,5' },
  { it: '22', diam: '20,6', circ: '64,7' },
  { it: '23', diam: '21,0', circ: '66,0' },
  { it: '24', diam: '21,4', circ: '67,2' },
  { it: '25', diam: '21,8', circ: '68,5' },
];

const highlights = [
  { icon: Ruler,  title: 'Misure IT 6–25',    description: 'Tabella completa con diametro e circonferenza' },
  { icon: Circle, title: 'Metodo filo',        description: 'Misura precisa con un filo o striscia di carta' },
  { icon: Info,   title: 'Consigli utili',     description: 'Suggerimenti per una misura accurata' },
];

export default function GuidaMisuraAnelliPage() {
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
              Guida alla Misura degli Anelli
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Scopri la tua misura perfetta con la nostra tabella completa e i metodi di misurazione.
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

      {/* Content */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">

            {/* Metodo filo/carta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Ruler className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Come Misurare il Dito</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                {/* Metodo 1 */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-rose text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                    Metodo con il filo o striscia di carta
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Taglia un pezzo di filo (o una striscia di carta sottile) di circa 10 cm.',
                      'Avvolgi il filo attorno alla base del dito che vuoi misurare.',
                      'Segna con una penna il punto in cui il filo si sovrappone.',
                      'Distendi il filo e misura la lunghezza in millimetri: questa è la tua circonferenza.',
                      'Consulta la tabella qui sotto per trovare la misura corrispondente.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-brand-rose mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metodo 2 */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-rose text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Metodo con un anello esistente
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Prendi un anello che ti calza bene sul dito desiderato.',
                      'Misura il diametro interno dell\'anello in millimetri.',
                      'Consulta la colonna "Diametro (mm)" nella tabella per trovare la tua misura.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-brand-rose mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Illustrazione SVG */}
                <div className="flex justify-center py-4">
                  <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Illustrazione misura anello">
                    {/* Dito stilizzato */}
                    <rect x="85" y="10" width="50" height="90" rx="25" fill="#f3e8ec" stroke="#c9748a" strokeWidth="2"/>
                    {/* Filo attorno */}
                    <ellipse cx="110" cy="65" rx="32" ry="10" fill="none" stroke="#c9748a" strokeWidth="2.5" strokeDasharray="5 3"/>
                    {/* Freccia diametro */}
                    <line x1="78" y1="65" x2="142" y2="65" stroke="#888" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)"/>
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill="#888"/>
                      </marker>
                    </defs>
                    <text x="110" y="90" textAnchor="middle" fontSize="11" fill="#888">⌀ diametro</text>
                    {/* Etichetta filo */}
                    <text x="155" y="62" fontSize="10" fill="#c9748a">filo</text>
                  </svg>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Consiglio:</strong> Misura il dito a fine giornata, quando è leggermente più grande. 
                    Evita di misurare quando hai freddo — le dita si restringono con il freddo.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Video guida */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Video Guida</h2>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-4">
                  Guarda il nostro video per imparare a misurare correttamente la tua misura anello in pochi secondi.
                </p>
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/fiazHW7LiqY"
                    title="Come misurare la misura dell'anello - Gaurosa"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>

            {/* Tabella misure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Circle className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tabella Misure Anelli</h2>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-pink-light">
                    <tr>
                      <th className="text-center px-4 py-3 font-semibold text-brand-text">Misura IT</th>
                      <th className="text-center px-4 py-3 font-semibold text-brand-text">Diametro (mm)</th>
                      <th className="text-center px-4 py-3 font-semibold text-brand-text">Circonferenza (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ringTable.map((row, i) => (
                      <tr key={row.it} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="text-center px-4 py-3 font-semibold text-brand-rose">{row.it}</td>
                        <td className="text-center px-4 py-3 text-gray-700">{row.diam}</td>
                        <td className="text-center px-4 py-3 text-gray-700">{row.circ}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Consigli */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Consigli Utili</h2>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                {[
                  { title: 'Dito dominante', text: 'Il dito della mano dominante è solitamente più grande di mezzo numero rispetto all\'altra mano.' },
                  { title: 'Nocca larga', text: 'Se la nocca è più larga della base del dito, scegli la misura che si infila sulla nocca e usa un fermaccia per anelli per tenerlo in posizione.' },
                  { title: 'Anelli larghi', text: 'Gli anelli con fascia larga (oltre 6 mm) tendono a calzare più stretti. Considera di prendere una misura in più.' },
                  { title: 'Non sei sicuro?', text: 'Se sei tra due misure, scegli sempre la più grande. È più facile stringere un anello che allargarlo.' },
                ].map((tip) => (
                  <div key={tip.title} className="flex items-start gap-3">
                    <ChevronRight className="w-4 h-4 text-brand-rose mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{tip.title}: </span>
                      <span className="text-gray-600 text-sm">{tip.text}</span>
                    </div>
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
              <h2 className="text-2xl font-bold mb-4">Hai bisogno di cambiare taglia?</h2>
              <p className="text-white/70 mb-6">
                La prima modifica misura è gratuita entro 60 giorni dal ricevimento.
              </p>
              <Link
                href="/modulo-cambio-taglia"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-rose font-medium rounded-xl hover:bg-brand-pink-light transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Richiedi Cambio Taglia
              </Link>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
