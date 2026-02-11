'use client';

import { motion } from 'framer-motion';
import { FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function TerminiPage() {
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
              Termini e Condizioni
            </h1>
            <p className="mt-4 text-gray-300">
              Condizioni generali di vendita del sito gaurosa.it
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

              {/* Premessa */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Identificazione del Venditore</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  <strong>Mazzon Gioielli S.N.C.</strong><br />
                  Via Don G. Carrara, 19 - 35010 Villa del Conte (PD) - Italia<br />
                  P.IVA: IT05120880280<br />
                  Email: <a href="mailto:info@gaurosa.it" className="underline">info@gaurosa.it</a> | 
                  Tel: <a href="tel:+390499390535" className="underline">+39 049 939 0535</a>
                </p>
              </div>

              {/* Art. 1 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Ambito di Applicazione</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Le presenti Condizioni Generali di Vendita (di seguito &quot;Condizioni&quot;) disciplinano la vendita 
                  dei prodotti commercializzati da Mazzon Gioielli S.N.C. (di seguito &quot;Venditore&quot;) attraverso 
                  il sito web gaurosa.it (di seguito &quot;Sito&quot;). L&apos;acquisto di prodotti sul Sito comporta 
                  l&apos;accettazione integrale delle presenti Condizioni. Il Venditore si riserva il diritto di 
                  modificare le Condizioni in qualsiasi momento; le modifiche saranno efficaci dalla data di 
                  pubblicazione sul Sito.
                </p>
              </div>

              {/* Art. 2 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Prodotti</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  I prodotti offerti in vendita sul Sito sono gioielli, orologi e accessori. Le immagini e le 
                  descrizioni dei prodotti sono il più possibile accurate, tuttavia possono presentare lievi 
                  differenze rispetto al prodotto reale dovute alle caratteristiche artigianali della lavorazione 
                  e alle impostazioni del monitor. Tali differenze non costituiscono difetto del prodotto.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  Ogni gioiello Gaurosa è realizzato a mano: lievi irregolarità e variazioni dell&apos;artigianato, 
                  così come le caratteristiche naturali del metallo o delle pietre preziose (colore, inclusioni 
                  interne, ecc.), sono da considerarsi caratteristiche del prodotto e non difetti.
                </p>
              </div>

              {/* Art. 3 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Prezzi</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tutti i prezzi indicati sul Sito sono espressi in Euro (€) e sono comprensivi di IVA. 
                  Le spese di spedizione sono indicate separatamente prima della conferma dell&apos;ordine. 
                  Il Venditore si riserva il diritto di modificare i prezzi in qualsiasi momento, 
                  fermo restando che il prezzo applicato sarà quello indicato al momento dell&apos;ordine.
                </p>
              </div>

              {/* Art. 4 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Procedura di Acquisto</h2>
                <div className="space-y-2">
                  {[
                    'L\'utente seleziona i prodotti desiderati e li aggiunge al carrello.',
                    'L\'utente procede al checkout inserendo i dati di spedizione e fatturazione.',
                    'L\'utente seleziona il metodo di pagamento e conferma l\'ordine.',
                    'Il Venditore invia una email di conferma dell\'ordine con il riepilogo.',
                    'Il contratto di vendita si intende concluso al momento dell\'invio della conferma d\'ordine.',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Art. 5 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Metodi di Pagamento</h2>
                <p className="text-gray-600 text-sm mb-3">Il Sito accetta i seguenti metodi di pagamento:</p>
                <ul className="space-y-1">
                  {[
                    'Carta di credito / debito (Visa, Mastercard, American Express)',
                    'PayPal',
                    'Bonifico bancario',
                    'Contrassegno (supplemento di 7,00 €)',
                  ].map((method, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {method}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 text-sm mt-3">
                  I pagamenti con carta di credito sono gestiti tramite piattaforme sicure certificate PCI-DSS. 
                  Il Venditore non ha accesso ai dati completi della carta di credito dell&apos;utente.
                </p>
              </div>

              {/* Art. 6 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Spedizioni e Consegna</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Le spedizioni sono gratuite per ordini di importo pari o superiore a 45,00 €. 
                  Per ordini inferiori, il costo di spedizione è di 5,90 €. I tempi di consegna sono 
                  di 24/72 ore lavorative dalla spedizione dell&apos;ordine. Per maggiori dettagli, 
                  consulta la pagina <Link href="/spedizioni" className="text-gray-900 underline font-medium">Spedizioni</Link>.
                </p>
              </div>

              {/* Art. 7 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Diritto di Recesso</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm font-medium">
                    L&apos;acquirente ha diritto di recedere dal contratto entro 60 giorni dalla consegna del prodotto, 
                    senza dover fornire alcuna motivazione.
                  </p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Per esercitare il diritto di recesso, l&apos;acquirente deve compilare il modulo di reso disponibile 
                  sul Sito e restituire il prodotto nelle condizioni originali, completo di confezione regalo, 
                  certificazioni e tutti gli elementi complementari. Il costo della spedizione di reso è a carico 
                  dell&apos;acquirente. Per maggiori dettagli, consulta la pagina{' '}
                  <Link href="/resi" className="text-gray-900 underline font-medium">Resi e Garanzia</Link>.
                </p>
              </div>

              {/* Art. 8 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Garanzia</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tutti i prodotti Gaurosa sono coperti dalla garanzia legale di conformità ai sensi degli 
                  artt. 128-135 del Codice del Consumo (D.Lgs. 206/2005). In aggiunta, il Venditore offre 
                  una garanzia gratuita per difetti di fabbricazione. La garanzia non copre danni causati da 
                  uso improprio, negligenza, interventi di terzi o normale usura. Per i dettagli completi, 
                  consulta la pagina <Link href="/resi" className="text-gray-900 underline font-medium">Resi e Garanzia</Link>.
                </p>
              </div>

              {/* Art. 9 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Proprietà Intellettuale</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Il marchio &quot;GAUROSA&quot;, il logo, le immagini, i testi e tutti i contenuti del Sito sono 
                  di proprietà esclusiva di Mazzon Gioielli S.N.C. e sono protetti dalle leggi italiane 
                  e internazionali sulla proprietà intellettuale. È vietata qualsiasi riproduzione, 
                  distribuzione o utilizzo non autorizzato dei contenuti del Sito.
                </p>
              </div>

              {/* Art. 10 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Limitazione di Responsabilità</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Il Venditore non è responsabile per danni diretti o indiretti derivanti dall&apos;utilizzo 
                  del Sito, da interruzioni del servizio, da errori o omissioni nei contenuti. 
                  Il Venditore non è responsabile per ritardi nella consegna dovuti a cause di forza maggiore 
                  o a responsabilità del corriere.
                </p>
              </div>

              {/* Art. 11 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">11. Privacy</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Il trattamento dei dati personali è disciplinato dalla nostra{' '}
                  <Link href="/privacy" className="text-gray-900 underline font-medium">Informativa sulla Privacy</Link>, 
                  parte integrante delle presenti Condizioni.
                </p>
              </div>

              {/* Art. 12 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">12. Legge Applicabile e Foro Competente</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Le presenti Condizioni sono regolate dalla legge italiana. Per qualsiasi controversia 
                  relativa all&apos;interpretazione, esecuzione o risoluzione delle presenti Condizioni, 
                  sarà competente il Foro di Padova, fatte salve le disposizioni inderogabili a tutela 
                  del consumatore che prevedono la competenza del foro del luogo di residenza o domicilio 
                  del consumatore.
                </p>
              </div>

              {/* Art. 13 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">13. Risoluzione delle Controversie Online</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ai sensi del Regolamento UE 524/2013, si informa che per la risoluzione delle controversie 
                  è possibile ricorrere alla piattaforma ODR (Online Dispute Resolution) messa a disposizione 
                  dalla Commissione Europea, accessibile al seguente link:{' '}
                  <a 
                    href="https://ec.europa.eu/consumers/odr" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-900 underline"
                  >
                    ec.europa.eu/consumers/odr
                  </a>.
                </p>
              </div>

              {/* Art. 14 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contatti</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Per qualsiasi domanda relativa alle presenti Condizioni, puoi contattarci a:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-3 text-sm text-gray-600">
                  <p><strong>Mazzon Gioielli S.N.C.</strong></p>
                  <p>Via Don G. Carrara, 19 - 35010 Villa del Conte (PD)</p>
                  <p>Email: <a href="mailto:info@gaurosa.it" className="underline">info@gaurosa.it</a></p>
                  <p>Telefono: <a href="tel:+390499390535" className="underline">+39 049 939 0535</a></p>
                  <p>WhatsApp: <a href="https://wa.me/+393926191199" className="underline">+39 392 619 1199</a></p>
                </div>
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
