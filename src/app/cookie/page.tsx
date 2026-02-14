'use client';

import { motion } from 'framer-motion';
import { Cookie, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CookiePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-rose via-brand-rose-dark to-brand-rose text-white py-24 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Cookie Policy
            </h1>
            <p className="mt-4 text-white/80">
              Informativa sull&apos;utilizzo dei cookie su gaurosa.it
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contenuto */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <p className="text-sm text-gray-400">Ultimo aggiornamento: 11 febbraio 2026</p>

              {/* 1. Cosa sono */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Cookie className="w-5 h-5" />
                  1. Cosa Sono i Cookie
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo (computer, 
                  tablet, smartphone) quando visiti un sito web. I cookie permettono al sito di riconoscerti 
                  nelle visite successive, memorizzare le tue preferenze e migliorare la tua esperienza di navigazione.
                </p>
              </div>

              {/* 2. Tipologie */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Tipologie di Cookie Utilizzati</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Il sito gaurosa.it utilizza le seguenti tipologie di cookie:
                </p>

                <div className="space-y-4">
                  {/* Tecnici */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <h3 className="font-semibold text-green-900 mb-2">Cookie Tecnici (necessari)</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Questi cookie sono essenziali per il funzionamento del Sito e non possono essere disattivati.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-green-200">
                            <th className="text-left py-2 pr-4 font-semibold text-green-900">Cookie</th>
                            <th className="text-left py-2 pr-4 font-semibold text-green-900">Finalità</th>
                            <th className="text-left py-2 font-semibold text-green-900">Durata</th>
                          </tr>
                        </thead>
                        <tbody className="text-green-800">
                          <tr className="border-b border-green-100">
                            <td className="py-2 pr-4 font-mono">gaurosa_auth</td>
                            <td className="py-2 pr-4">Autenticazione utente</td>
                            <td className="py-2">7 giorni</td>
                          </tr>
                          <tr className="border-b border-green-100">
                            <td className="py-2 pr-4 font-mono">gaurosa_cart</td>
                            <td className="py-2 pr-4">Gestione carrello acquisti</td>
                            <td className="py-2">30 giorni</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono">cookie_consent</td>
                            <td className="py-2 pr-4">Memorizza le preferenze cookie</td>
                            <td className="py-2">12 mesi</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Analitici */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 mb-2">Cookie Analitici (previo consenso)</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Questi cookie ci permettono di raccogliere informazioni anonime sull&apos;utilizzo del Sito 
                      per migliorare i nostri servizi.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-blue-200">
                            <th className="text-left py-2 pr-4 font-semibold text-blue-900">Servizio</th>
                            <th className="text-left py-2 pr-4 font-semibold text-blue-900">Finalità</th>
                            <th className="text-left py-2 font-semibold text-blue-900">Durata</th>
                          </tr>
                        </thead>
                        <tbody className="text-blue-800">
                          <tr>
                            <td className="py-2 pr-4">Google Analytics 4</td>
                            <td className="py-2 pr-4">Statistiche di utilizzo anonime</td>
                            <td className="py-2">26 mesi</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-blue-700 mt-3">
                      Google Analytics è configurato con anonimizzazione dell&apos;indirizzo IP. 
                      I dati raccolti non permettono l&apos;identificazione diretta dell&apos;utente.
                    </p>
                  </div>

                  {/* Marketing */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="font-semibold text-amber-900 mb-2">Cookie di Marketing (previo consenso)</h3>
                    <p className="text-sm text-amber-800 mb-3">
                      Questi cookie sono utilizzati per mostrare annunci pubblicitari pertinenti ai tuoi interessi.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-amber-200">
                            <th className="text-left py-2 pr-4 font-semibold text-amber-900">Servizio</th>
                            <th className="text-left py-2 pr-4 font-semibold text-amber-900">Finalità</th>
                            <th className="text-left py-2 font-semibold text-amber-900">Durata</th>
                          </tr>
                        </thead>
                        <tbody className="text-amber-800">
                          <tr className="border-b border-amber-100">
                            <td className="py-2 pr-4">Meta Pixel (Facebook)</td>
                            <td className="py-2 pr-4">Remarketing e conversioni</td>
                            <td className="py-2">90 giorni</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Google Ads</td>
                            <td className="py-2 pr-4">Monitoraggio conversioni</td>
                            <td className="py-2">90 giorni</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Gestione */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Come Gestire i Cookie</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Al primo accesso al Sito, ti verrà mostrato un banner per la gestione dei cookie. 
                  Puoi accettare tutti i cookie, rifiutare quelli non necessari o personalizzare le tue preferenze.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Puoi inoltre gestire i cookie direttamente dal tuo browser. Ecco come fare nei principali browser:
                </p>
                <div className="space-y-2">
                  {[
                    { browser: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                    { browser: 'Mozilla Firefox', url: 'https://support.mozilla.org/it/kb/Gestione%20dei%20cookie' },
                    { browser: 'Apple Safari', url: 'https://support.apple.com/it-it/guide/safari/sfri11471/mac' },
                    { browser: 'Microsoft Edge', url: 'https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
                  ].map((item) => (
                    <a
                      key={item.browser}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{item.browser}</span>
                    </a>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Nota:</strong> La disattivazione dei cookie tecnici potrebbe compromettere il 
                    funzionamento del Sito (ad esempio, il carrello acquisti o l&apos;accesso all&apos;area riservata).
                  </p>
                </div>
              </div>

              {/* 4. Cookie di terze parti */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookie di Terze Parti</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Alcuni cookie sono installati da servizi di terze parti che compaiono sulle nostre pagine. 
                  Non abbiamo il controllo diretto su questi cookie. Per maggiori informazioni, consulta 
                  le privacy policy dei rispettivi servizi:
                </p>
                <ul className="space-y-2">
                  {[
                    { name: 'Google Analytics', url: 'https://policies.google.com/privacy' },
                    { name: 'Meta (Facebook)', url: 'https://www.facebook.com/privacy/policy/' },
                    { name: 'PayPal', url: 'https://www.paypal.com/it/legalhub/privacy-full' },
                    { name: 'Stripe', url: 'https://stripe.com/it/privacy' },
                  ].map((service) => (
                    <li key={service.name}>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{service.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. Aggiornamenti */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Aggiornamenti</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  La presente Cookie Policy può essere aggiornata periodicamente. Ti invitiamo a consultare 
                  questa pagina regolarmente per essere informato su eventuali modifiche. La data dell&apos;ultimo 
                  aggiornamento è indicata in cima a questa pagina.
                </p>
              </div>

              {/* 6. Contatti */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contatti</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Per qualsiasi domanda relativa all&apos;utilizzo dei cookie, puoi contattarci a:{' '}
                  <a href="mailto:info@gaurosa.it" className="text-gray-900 underline font-medium">info@gaurosa.it</a>.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Per informazioni sul trattamento dei dati personali, consulta la nostra{' '}
                  <Link href="/privacy" className="text-gray-900 underline font-medium">Informativa sulla Privacy</Link>.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t text-center">
                <p className="text-sm text-gray-400">
                  Gaurosa - marchio di proprietà della Mazzon Gioielli S.N.C. - P.IVA IT05120880280
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
