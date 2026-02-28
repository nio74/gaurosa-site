'use client';

import { motion } from 'framer-motion';
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const paymentMethods = [
  {
    id: 'carta',
    title: 'Carta di Credito / Debito',
    description: 'Paga in modo sicuro con Visa, Mastercard, American Express e tutte le principali carte.',
    details: [
      'Pagamento immediato e sicuro',
      'Crittografia SSL 256-bit',
      'Nessun costo aggiuntivo',
      'Addebito solo alla conferma dell\'ordine',
    ],
    badge: 'Più usato',
    badgeColor: 'bg-green-100 text-green-700',
    icon: (
      <svg viewBox="0 0 48 32" className="w-12 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#1a1f71"/>
        <text x="6" y="22" fontSize="12" fontWeight="bold" fill="#fff">VISA</text>
      </svg>
    ),
  },
  {
    id: 'paypal',
    title: 'PayPal',
    description: 'Paga con il tuo account PayPal o con carta tramite PayPal. Protezione acquirente inclusa.',
    details: [
      'Protezione acquirente PayPal',
      'Nessuna condivisione dati bancari',
      'Rimborso garantito in caso di problemi',
      'Disponibile anche senza account PayPal',
    ],
    badge: 'Consigliato',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: (
      <svg viewBox="0 0 80 32" className="w-16 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="24" fontSize="20" fontWeight="bold" fill="#003087">Pay</text>
        <text x="36" y="24" fontSize="20" fontWeight="bold" fill="#009cde">Pal</text>
      </svg>
    ),
  },
  {
    id: 'bonifico',
    title: 'Bonifico Bancario',
    description: 'Paga tramite bonifico bancario. L\'ordine viene elaborato dopo la ricezione del pagamento.',
    details: [
      'Nessun costo aggiuntivo',
      'Elaborazione dopo ricezione bonifico (2-3 giorni)',
      'IBAN comunicato via email dopo l\'ordine',
      'Causale: numero ordine',
    ],
    badge: null,
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 48 32" className="w-12 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#f0f4f8"/>
        <rect x="8" y="14" width="32" height="3" rx="1.5" fill="#4a5568"/>
        <rect x="8" y="8" width="32" height="3" rx="1.5" fill="#4a5568"/>
        <rect x="8" y="20" width="20" height="3" rx="1.5" fill="#4a5568"/>
      </svg>
    ),
  },
];

const securityFeatures = [
  { icon: Shield,       text: 'Connessione SSL crittografata' },
  { icon: CheckCircle,  text: 'Pagamenti certificati PCI DSS' },
  { icon: Clock,        text: 'Addebito solo alla spedizione' },
];

export default function MetodiDiPagamentoPage() {
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
              Metodi di Pagamento
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Scegli il metodo di pagamento più comodo per te. Tutti i pagamenti sono sicuri e protetti.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security bar */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 justify-center">
            {securityFeatures.map((feat) => (
              <div key={feat.text} className="flex items-center gap-2 text-sm text-gray-600">
                <feat.icon className="w-4 h-4 text-green-500" />
                {feat.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">

            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{method.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">{method.title}</h3>
                        {method.badge && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{method.description}</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 mt-4 pt-4 border-t border-gray-100">
                  {method.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Nota sicurezza */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">I tuoi dati sono al sicuro</h3>
                  <p className="text-blue-800 text-sm">
                    Gaurosa non memorizza mai i dati della tua carta di credito. Tutti i pagamenti 
                    vengono elaborati tramite gateway certificati e sicuri. La connessione è sempre 
                    protetta da crittografia SSL.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bonifico dettagli */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Dati per il Bonifico Bancario</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">Intestatario</span>
                  <span className="text-gray-900 font-semibold text-right">MAZZON GIOIELLI S.N.C.</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">IBAN</span>
                  <span className="text-gray-900 font-mono font-semibold text-right">IT90Z0832763100000000800479</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">Banca</span>
                  <span className="text-gray-900 text-right">BCC di Roma — AG. 204</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">SWIFT/BIC</span>
                  <span className="text-gray-900 font-mono text-right">ICRAITRRROM</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">Causale</span>
                  <span className="text-gray-900 text-right">Numero ordine (comunicato via email)</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
