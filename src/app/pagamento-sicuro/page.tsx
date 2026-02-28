'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Crittografia SSL 256-bit',
    description: 'Tutti i dati trasmessi tra il tuo browser e il nostro sito sono protetti dalla crittografia SSL a 256 bit, lo stesso standard usato dalle banche.',
    badge: 'HTTPS',
  },
  {
    icon: Shield,
    title: 'Certificazione PCI DSS',
    description: 'I nostri gateway di pagamento sono certificati PCI DSS (Payment Card Industry Data Security Standard), il massimo standard di sicurezza per i pagamenti online.',
    badge: 'PCI DSS',
  },
  {
    icon: Eye,
    title: 'Nessuna memorizzazione dati',
    description: 'Gaurosa non memorizza mai i dati della tua carta di credito. I dati di pagamento vengono gestiti esclusivamente dai gateway certificati (Stripe, PayPal).',
    badge: 'Zero storage',
  },
  {
    icon: CheckCircle,
    title: 'Autenticazione 3D Secure',
    description: 'I pagamenti con carta supportano il protocollo 3D Secure (Verified by Visa, Mastercard SecureCode) per una protezione aggiuntiva contro le frodi.',
    badge: '3DS',
  },
];

const certifications = [
  { name: 'SSL/TLS', desc: 'Connessione sicura HTTPS' },
  { name: 'PCI DSS', desc: 'Standard sicurezza pagamenti' },
  { name: '3D Secure', desc: 'Autenticazione avanzata' },
  { name: 'GDPR', desc: 'Protezione dati personali' },
];

const tips = [
  'Verifica sempre che l\'URL inizi con "https://" e che ci sia il lucchetto verde nella barra del browser.',
  'Non condividere mai i tuoi dati di pagamento via email o telefono.',
  'Usa una connessione sicura (non Wi-Fi pubblico) per i tuoi acquisti online.',
  'Controlla regolarmente il tuo estratto conto per verificare le transazioni.',
  'In caso di transazione sospetta, contatta immediatamente la tua banca.',
];

export default function PagamentoSicuroPage() {
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
            {/* Shield SVG badge */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Pagamento Sicuro
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              I tuoi dati sono protetti dai più alti standard di sicurezza. 
              Acquista su Gaurosa con la massima tranquillità.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications bar */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 justify-center">
            {certifications.map((cert) => (
              <div key={cert.name} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* Security features */}
            {securityFeatures.map((feat, index) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-rose text-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg">{feat.title}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Come funziona SSL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Come riconoscere una connessione sicura</h2>
              </div>

              {/* Browser mockup */}
              <div className="bg-gray-100 rounded-lg p-3 mb-4 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded px-3 py-1.5 flex items-center gap-2 text-xs">
                    <Lock className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 font-semibold">https://</span>
                    <span className="text-gray-700">gaurosa.it/checkout</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2">
                {[
                  'Il lucchetto verde nella barra degli indirizzi indica una connessione sicura',
                  'L\'URL inizia sempre con "https://" (la "s" sta per "sicuro")',
                  'Cliccando sul lucchetto puoi verificare il certificato SSL del sito',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Consigli sicurezza */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Consigli per Acquisti Sicuri</h2>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="font-bold text-amber-600 flex-shrink-0">{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gateway partners */}
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
                <h2 className="text-xl font-bold text-gray-900">I Nostri Partner di Pagamento</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Utilizziamo solo gateway di pagamento certificati e affidabili per garantire la massima sicurezza delle tue transazioni.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Stripe', desc: 'Leader mondiale nei pagamenti online, certificato PCI DSS Level 1' },
                  { name: 'PayPal', desc: 'Protezione acquirente inclusa su tutti gli acquisti idonei' },
                ].map((partner) => (
                  <div key={partner.name} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-bold text-gray-900 mb-1">{partner.name}</p>
                    <p className="text-xs text-gray-500">{partner.desc}</p>
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
              <Shield className="w-10 h-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl font-bold mb-4">Acquista con Fiducia</h2>
              <p className="text-white/70 mb-6">
                La tua sicurezza è la nostra priorità. Scopri i nostri metodi di pagamento disponibili.
              </p>
              <Link
                href="/metodi-di-pagamento"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-rose font-medium rounded-xl hover:bg-brand-pink-light transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Metodi di Pagamento
              </Link>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
