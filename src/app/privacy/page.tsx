'use client';

import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Informativa sulla Privacy
            </h1>
            <p className="mt-4 text-gray-300">
              Ai sensi del Regolamento UE 2016/679 (GDPR)
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
              {/* Ultimo aggiornamento */}
              <p className="text-sm text-gray-400">Ultimo aggiornamento: 11 febbraio 2026</p>

              {/* Titolare */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Titolare del Trattamento dei Dati
                </h2>
                <p className="text-gray-600">
                  <strong>Mazzon Gioielli S.N.C.</strong><br />
                  Via Don G. Carrara, 19<br />
                  35010 Villa del Conte (PD) - Italia<br />
                  P.IVA: IT05120880280<br />
                  Email: <a href="mailto:info@gaurosa.it" className="text-gray-900 underline">info@gaurosa.it</a><br />
                  Telefono: <a href="tel:+390499390535" className="text-gray-900 underline">+39 049 939 0535</a>
                </p>
              </div>

              {/* 1. Introduzione */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduzione</h2>
                <p className="text-gray-600 leading-relaxed">
                  La presente informativa descrive le modalità di trattamento dei dati personali degli utenti 
                  che consultano il sito web <strong>gaurosa.it</strong> (di seguito &quot;Sito&quot;) e che usufruiscono 
                  dei servizi offerti da Mazzon Gioielli S.N.C. (di seguito &quot;Titolare&quot;). 
                  L&apos;informativa è resa ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 
                  (Regolamento Generale sulla Protezione dei Dati, di seguito &quot;GDPR&quot;).
                </p>
              </div>

              {/* 2. Dati raccolti */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Tipologie di Dati Raccolti</h2>
                <p className="text-gray-600 mb-4">
                  Il Sito raccoglie le seguenti categorie di dati personali:
                </p>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Dati di navigazione</h3>
                    <p className="text-sm text-gray-600">
                      Indirizzo IP, tipo di browser, sistema operativo, pagine visitate, data e ora di accesso, 
                      URL di provenienza. Questi dati sono raccolti automaticamente durante la navigazione.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Dati forniti volontariamente</h3>
                    <p className="text-sm text-gray-600">
                      Nome, cognome, email, telefono, indirizzo di spedizione e fatturazione, Codice Fiscale, 
                      Partita IVA, Codice SDI, PEC. Questi dati sono forniti dall&apos;utente durante la registrazione, 
                      l&apos;acquisto o la compilazione di moduli di contatto.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Dati di pagamento</h3>
                    <p className="text-sm text-gray-600">
                      I dati relativi ai pagamenti (numero carta di credito, dati PayPal, ecc.) sono gestiti 
                      direttamente dai fornitori di servizi di pagamento (Stripe, PayPal) e non vengono 
                      memorizzati sui nostri server.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Finalità */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalità del Trattamento</h2>
                <p className="text-gray-600 mb-4">I dati personali sono trattati per le seguenti finalità:</p>
                <div className="space-y-2">
                  {[
                    { title: 'Esecuzione del contratto', desc: 'Gestione degli ordini, spedizioni, fatturazione, assistenza post-vendita, gestione resi e garanzie.' },
                    { title: 'Obblighi di legge', desc: 'Adempimenti fiscali, contabili e normativi previsti dalla legge italiana ed europea.' },
                    { title: 'Registrazione e autenticazione', desc: 'Creazione e gestione dell\'account utente sul Sito.' },
                    { title: 'Comunicazioni di servizio', desc: 'Invio di conferme d\'ordine, aggiornamenti sulla spedizione, comunicazioni relative al servizio.' },
                    { title: 'Marketing (previo consenso)', desc: 'Invio di newsletter, promozioni, offerte personalizzate. Il consenso è facoltativo e revocabile in qualsiasi momento.' },
                    { title: 'Miglioramento del servizio', desc: 'Analisi statistiche anonime sull\'utilizzo del Sito per migliorare l\'esperienza utente.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">{item.title}:</strong> {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Base giuridica */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base Giuridica del Trattamento</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong className="text-gray-900">Art. 6(1)(b) GDPR</strong> - Esecuzione di un contratto: il trattamento è necessario per l&apos;esecuzione dell&apos;ordine di acquisto.</p>
                  <p><strong className="text-gray-900">Art. 6(1)(c) GDPR</strong> - Obbligo legale: il trattamento è necessario per adempiere a obblighi fiscali e contabili.</p>
                  <p><strong className="text-gray-900">Art. 6(1)(a) GDPR</strong> - Consenso: per l&apos;invio di comunicazioni commerciali e newsletter.</p>
                  <p><strong className="text-gray-900">Art. 6(1)(f) GDPR</strong> - Legittimo interesse: per la prevenzione delle frodi e il miglioramento del servizio.</p>
                </div>
              </div>

              {/* 5. Conservazione */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Periodo di Conservazione</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  <p><strong className="text-gray-900">Dati contrattuali e fiscali:</strong> 10 anni dalla conclusione del rapporto contrattuale, come previsto dalla normativa fiscale italiana.</p>
                  <p><strong className="text-gray-900">Dati dell&apos;account:</strong> fino alla cancellazione dell&apos;account da parte dell&apos;utente.</p>
                  <p><strong className="text-gray-900">Dati di navigazione:</strong> 26 mesi dalla raccolta.</p>
                  <p><strong className="text-gray-900">Dati per marketing:</strong> fino alla revoca del consenso.</p>
                </div>
              </div>

              {/* 6. Condivisione */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Condivisione dei Dati</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  I dati personali possono essere comunicati alle seguenti categorie di destinatari:
                </p>
                <ul className="space-y-2">
                  {[
                    'Corrieri e servizi di spedizione (per la consegna degli ordini)',
                    'Fornitori di servizi di pagamento (Stripe, PayPal)',
                    'Servizi di hosting e infrastruttura IT (Hostinger)',
                    'Consulenti fiscali e commercialisti (per obblighi di legge)',
                    'Autorità competenti (se richiesto dalla legge)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 text-sm mt-4">
                  I dati personali <strong>non vengono venduti</strong> a terzi e non vengono trasferiti 
                  al di fuori dello Spazio Economico Europeo (SEE).
                </p>
              </div>

              {/* 7. Diritti */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. I Tuoi Diritti</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  In qualità di interessato, ai sensi degli artt. 15-22 del GDPR, hai il diritto di:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Accesso', desc: 'Ottenere conferma del trattamento e accedere ai tuoi dati' },
                    { title: 'Rettifica', desc: 'Correggere dati inesatti o incompleti' },
                    { title: 'Cancellazione', desc: 'Richiedere la cancellazione dei tuoi dati ("diritto all\'oblio")' },
                    { title: 'Limitazione', desc: 'Limitare il trattamento in determinati casi' },
                    { title: 'Portabilità', desc: 'Ricevere i tuoi dati in formato strutturato e leggibile' },
                    { title: 'Opposizione', desc: 'Opporti al trattamento per motivi legittimi' },
                  ].map((right) => (
                    <div key={right.title} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900 text-sm">{right.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{right.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  Per esercitare i tuoi diritti, puoi contattarci all&apos;indirizzo email{' '}
                  <a href="mailto:info@gaurosa.it" className="text-gray-900 underline">info@gaurosa.it</a>.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Hai inoltre il diritto di proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali 
                  (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline">www.garanteprivacy.it</a>).
                </p>
              </div>

              {/* 8. Cookie */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookie</h2>
                <p className="text-gray-600 text-sm">
                  Per informazioni sull&apos;utilizzo dei cookie, consulta la nostra{' '}
                  <Link href="/cookie" className="text-gray-900 underline font-medium">Cookie Policy</Link>.
                </p>
              </div>

              {/* 9. Sicurezza */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Sicurezza dei Dati</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali da accessi 
                  non autorizzati, perdita, distruzione o alterazione. Il Sito utilizza il protocollo HTTPS 
                  per la trasmissione sicura dei dati. I dati di pagamento sono gestiti da fornitori certificati 
                  PCI-DSS e non transitano sui nostri server.
                </p>
              </div>

              {/* 10. Modifiche */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Modifiche alla Privacy Policy</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Il Titolare si riserva il diritto di apportare modifiche alla presente informativa in qualsiasi momento. 
                  Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento. 
                  Si consiglia di consultare periodicamente questa pagina.
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
