'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Send, CheckCircle, AlertCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from '@/components/ui/Link';

type FormState = 'form' | 'confirm' | 'loading' | 'success';

export default function RecessoPage() {
  const [formState, setFormState] = useState<FormState>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    numero_ordine: '',
    data_ordine: '',
    beni: '',
    consenso: false,
  });

  const serverUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';

  // Prefill numero ordine se si arriva da "I miei ordini" (?order=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const order = params.get('order');
      const beni = params.get('beni');
      if (order || beni) {
        setForm((prev) => ({
          ...prev,
          numero_ordine: order || prev.numero_ordine,
          beni: beni || prev.beni,
        }));
      }
    } catch { /* no-op */ }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Step 1 → passa al riepilogo di conferma
  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consenso) {
      setErrorMsg('Devi accettare il trattamento dei dati per procedere.');
      return;
    }
    setErrorMsg('');
    setFormState('confirm');
  };

  // Step 2 → "Conferma recesso": invio definitivo
  const handleConfirm = async () => {
    setFormState('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${serverUrl}/api/withdrawal-requests.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, conferma_recesso: true }),
      });
      const data = await res.json();
      if (data.success) {
        setReceivedAt(data.data?.received_at || '');
        setFormState('success');
      } else {
        setErrorMsg(data.error || 'Errore nell\'invio. Riprova.');
        setFormState('confirm');
      }
    } catch {
      setErrorMsg('Errore di connessione. Riprova più tardi.');
      setFormState('confirm');
    }
  };

  // ─── Schermata di successo ──────────────────────────────────────────────
  if (formState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 shadow-sm max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recesso registrato</h2>
          <p className="text-gray-600 mb-2">
            La tua dichiarazione di recesso è stata ricevuta{receivedAt ? ` il ${receivedAt}` : ''}.
          </p>
          <p className="text-gray-600 mb-6">
            Ti abbiamo inviato un&apos;email di conferma con il testo della dichiarazione. Conservala come ricevuta:
            ti contatteremo per la restituzione e il rimborso.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-rose text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Torna alla Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-rose via-brand-rose-dark to-brand-rose text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">Diritto di Recesso</h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Hai cambiato idea? Puoi recedere dal contratto entro 14 giorni, senza dover fornire motivazioni.
              Compila il modulo qui sotto.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-rose/5 border border-brand-rose/20 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-rose mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1 text-gray-900">Come funziona il recesso</p>
                  <ul className="space-y-1">
                    {[
                      'Hai 14 giorni dalla consegna per recedere, senza penali né motivazioni (art. 52 Cod. Consumo).',
                      'Le spese di spedizione per la restituzione del prodotto sono a carico del cliente.',
                      'Il rimborso (incluse le spese di consegna standard iniziali) avviene entro 14 giorni dalla comunicazione, con lo stesso mezzo di pagamento.',
                      'Dopo l’invio riceverai una email di conferma con data e ora.',
                      'Sono esclusi dal recesso i beni personalizzati: gioielli con incisione, anelli ridimensionati su richiesta, produzione su commessa (art. 59 lett. c Cod. Consumo).',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-rose" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    Puoi anche utilizzare il{' '}
                    <a href="/modulo-recesso-tipo" className="text-brand-rose hover:underline font-medium">modulo tipo di recesso</a>{' '}
                    (Allegato I.B Cod. Consumo) e inviarlo a{' '}
                    <a href="mailto:info@gaurosa.it" className="text-brand-rose hover:underline">info@gaurosa.it</a>.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* STEP CONFERMA — riepilogo + "Conferma recesso" */}
            {formState === 'confirm' || formState === 'loading' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 lg:p-8 shadow-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Conferma la tua richiesta di recesso</h2>
                <p className="text-sm text-gray-600 mb-5">
                  Controlla i dati. Cliccando <strong>&laquo;Conferma recesso&raquo;</strong> invii la dichiarazione
                  di recesso dal contratto.
                </p>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6 text-sm">
                  {[
                    ['Nome e cognome', form.nome],
                    ['Email', form.email],
                    ['Numero ordine', form.numero_ordine],
                    ['Data ordine', form.data_ordine || '—'],
                    ['Beni acquistati', form.beni],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 px-4 py-2.5">
                      <span className="w-1/3 font-medium text-gray-500">{label}</span>
                      <span className="flex-1 text-gray-900 whitespace-pre-wrap">{value}</span>
                    </div>
                  ))}
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setFormState('form')}
                    disabled={formState === 'loading'}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={formState === 'loading'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-rose text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formState === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Conferma recesso
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* STEP FORM */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 lg:p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Modulo di Recesso</h2>
                </div>

                <form onSubmit={handleProceed} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nome e Cognome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text" name="nome" value={form.nome} onChange={handleChange} required
                        placeholder="Mario Rossi"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange} required
                        placeholder="mario@email.it"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Numero Ordine <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text" name="numero_ordine" value={form.numero_ordine} onChange={handleChange} required
                        placeholder="es. ORD-2026-001234"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lo trovi nell&apos;email di conferma ordine</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Data Ordine (opzionale)
                      </label>
                      <input
                        type="text" name="data_ordine" value={form.data_ordine} onChange={handleChange}
                        placeholder="es. 10/06/2026"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Beni acquistati da cui recedere <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="beni" value={form.beni} onChange={handleChange} required rows={3}
                      placeholder="es. Anello Solitario Oro Bianco 18kt (1 pz)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox" id="consenso" name="consenso" checked={form.consenso} onChange={handleChange}
                      className="mt-0.5 w-4 h-4 accent-brand-rose"
                    />
                    <label htmlFor="consenso" className="text-sm text-gray-600">
                      Acconsento al trattamento dei dati per la gestione della richiesta di recesso (vedi{' '}
                      <Link href="/privacy" className="text-brand-rose hover:underline">Privacy Policy</Link>).{' '}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-rose text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Procedi
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
