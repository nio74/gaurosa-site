'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

const fontOptions = [
  'Script (corsivo elegante)',
  'Block (stampatello)',
  'Sans-serif (moderno)',
  'Serif (classico)',
  'Nessuna preferenza',
];

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ModuloIncisioniPage() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    numero_ordine: '',
    codice_prodotto: '',
    testo_incisione: '',
    font: '',
    note: '',
  });

  const serverUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';
  const maxChars = 30;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Limit testo_incisione to maxChars
    if (name === 'testo_incisione' && value.length > maxChars) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${serverUrl}/api/contact-form.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'incisioni', ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setFormState('success');
      } else {
        setErrorMsg(data.error || 'Errore nell\'invio. Riprova.');
        setFormState('error');
      }
    } catch {
      setErrorMsg('Errore di connessione. Riprova più tardi.');
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 shadow-sm max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Richiesta Inviata!</h2>
          <p className="text-gray-600 mb-6">
            Abbiamo ricevuto la tua richiesta di incisione. Ti contatteremo entro 24 ore lavorative 
            per confermare i dettagli e il costo (20,00 € spedizione inclusa).
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
      <section className="bg-gradient-to-br from-brand-rose via-brand-rose-dark to-brand-rose text-white py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Richiesta Incisione
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Personalizza il tuo gioiello con un&apos;incisione. Costo: 20,00 € (spedizione inclusa).
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
              className="bg-blue-50 border border-blue-200 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-semibold">Informazioni sull&apos;incisione</p>
                  <p>Costo: <strong>20,00 €</strong> (spedizione di ritorno inclusa)</p>
                  <p>Tempo: circa <strong>25 giorni lavorativi</strong></p>
                  <p>L&apos;incisione <strong>non invalida la garanzia</strong> Gaurosa</p>
                  <p>Massimo <strong>{maxChars} caratteri</strong> per il testo</p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 lg:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-rose text-white rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Dati per l&apos;Incisione</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nome e Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome e Cognome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      required
                      placeholder="Mario Rossi"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="mario@email.it"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Numero ordine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Numero Ordine <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numero_ordine"
                    value={form.numero_ordine}
                    onChange={handleChange}
                    required
                    placeholder="es. ORD-2024-001234"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Trovi il numero ordine nell&apos;email di conferma</p>
                </div>

                {/* Codice prodotto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Codice Prodotto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="codice_prodotto"
                    value={form.codice_prodotto}
                    onChange={handleChange}
                    required
                    placeholder="es. M170 — visibile sull'etichetta o nell'ordine"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                  />
                </div>

                {/* Testo incisione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Testo da Incidere <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="testo_incisione"
                      value={form.testo_incisione}
                      onChange={handleChange}
                      required
                      maxLength={maxChars}
                      placeholder="es. Per sempre insieme"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent pr-16"
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${form.testo_incisione.length >= maxChars ? 'text-red-500' : 'text-gray-400'}`}>
                      {form.testo_incisione.length}/{maxChars}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Massimo {maxChars} caratteri, inclusi spazi e punteggiatura</p>
                </div>

                {/* Font */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Font Preferito
                  </label>
                  <select
                    name="font"
                    value={form.font}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent bg-white"
                  >
                    <option value="">Seleziona un font...</option>
                    {fontOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Note Aggiuntive (opzionale)
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Eventuali richieste particolari o informazioni aggiuntive..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent resize-none"
                  />
                </div>

                {/* Error */}
                {formState === 'error' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-rose text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formState === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Invia Richiesta di Incisione
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Dopo l&apos;invio ti contatteremo per confermare i dettagli e le istruzioni per la spedizione.
                </p>
              </form>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
