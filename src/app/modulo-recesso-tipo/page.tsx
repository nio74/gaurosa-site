import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modulo Tipo di Recesso',
  description:
    'Modulo tipo di recesso (Allegato I.B, Codice del Consumo) per gli acquisti su gaurosa.it. Compilalo e invialo a info@gaurosa.it per esercitare il diritto di recesso entro 14 giorni.',
  alternates: { canonical: '/modulo-recesso-tipo/' },
};

export default function ModuloRecessoTipoPage() {
  return (
    <main className="container mx-auto px-4 py-16 lg:py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modulo tipo di recesso</h1>
        <p className="text-sm text-gray-500 mb-8">Allegato I, parte B — D.Lgs. 206/2005 (Codice del Consumo)</p>

        <p className="text-gray-600 mb-6">
          Hai diritto di recedere dall&apos;acquisto entro <strong>14 giorni</strong> dalla consegna, senza
          fornire alcuna motivazione. Puoi compilare e inviare il modulo qui sotto a{' '}
          <a href="mailto:info@gaurosa.it" className="text-brand-rose hover:underline">info@gaurosa.it</a>{' '}
          (l&apos;uso di questo modulo è facoltativo: è valida qualsiasi dichiarazione esplicita di recesso).
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-800 leading-relaxed whitespace-pre-line text-sm">
{`Destinatario:
GAUROSA di Mazzon Gioielli S.N.C.
Via Don G. Carrara, 19 – 35010 Villa del Conte (PD) – Italia
Email: info@gaurosa.it

Con la presente io/noi (*) notifichiamo il recesso dal mio/nostro (*) contratto
di vendita dei seguenti beni (*) / per la fornitura del seguente servizio (*):

________________________________________________________________

Ordinato il (*) / ricevuto il (*): _____________________________

Nome del/dei consumatore(i): __________________________________

Indirizzo del/dei consumatore(i): _____________________________

Firma del/dei consumatore(i)
(solo se il presente modulo è notificato in versione cartacea): ______________

Data: __________________________

(*) Cancellare la voce che non interessa.`}
        </div>

        <div className="mt-8 text-sm text-gray-600 space-y-2">
          <p>
            Le spese di spedizione per la restituzione del prodotto sono a carico del cliente. Il rimborso —
            comprensivo delle spese di consegna standard iniziali — sarà effettuato entro 14 giorni dalla
            comunicazione di recesso, con lo stesso mezzo di pagamento utilizzato per l&apos;acquisto.
          </p>
          <p>
            Maggiori dettagli nelle pagine{' '}
            <Link href="/recesso" className="text-brand-rose hover:underline">Diritto di Recesso</Link>,{' '}
            <Link href="/resi" className="text-brand-rose hover:underline">Resi e Garanzia</Link> e{' '}
            <Link href="/termini" className="text-brand-rose hover:underline">Termini e Condizioni</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
