'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Send, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const motiviReso = [
  'Prodotto non corrispondente alla descrizione',
  'Prodotto difettoso o danneggiato',
  'Taglia/misura errata',
  'Cambio idea',
  'Prodotto ricevuto in ritardo',
  'Altro',
];

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ModuloResoPage() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    numero_ordine: '',
    prodotto: '',
    motivo: '',
    descrizione: '',
    consenso: false,
  });

  const serverUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consenso) {
      setErrorMsg('Devi accettare il consenso per procedere.');
      setFormState('error');
      return;
    }

    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${serverUrl}/api/contact-form.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reso', ...form }),
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
            Abbiamo ricevuto la tua richiesta di reso. Ti risponderemo entro 24 ore lavorative 
            all&apos;indirizzo email fornito.
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
              Modulo di Reso
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Compila il modulo per avviare la procedura di reso. Hai 60 giorni dalla consegna.
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
              className="bg-green-50 border border-green-200 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Hai 60 giorni per il reso</p>
                  <ul className="space-y-1">
                    {[
                      'Il prodotto deve essere non indossato e nelle condizioni originali',
                      'Includi la confezione regalo e tutti gli accessori',
                      'Le spese di spedizione di ritorno sono a carico del cliente',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Dati per il Reso</h2>
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

                {/* Prodotto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prodotto da Restituire <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prodotto"
                    value={form.prodotto}
                    onChange={handleChange}
                    required
                    placeholder="es. Anello Solitario Oro Bianco 18kt"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Motivo del Reso <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent bg-white"
                  >
                    <option value="">Seleziona un motivo...</option>
                    {motiviReso.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Descrizione (opzionale)
                  </label>
                  <textarea
                    name="descrizione"
                    value={form.descrizione}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Descrivi il problema o fornisci ulteriori dettagli..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent resize-none"
                  />
                </div>

                {/* Consenso */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consenso"
                    name="consenso"
                    checked={form.consenso}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 accent-brand-rose"
                  />
                  <label htmlFor="consenso" className="text-sm text-gray-600">
                    Confermo di aver letto le{' '}
                    <Link href="/resi" className="text-brand-rose hover:underline">
                      condizioni di reso
                    </Link>{' '}
                    e di voler procedere con la richiesta. <span className="text-red-500">*</span>
                  </label>
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
                      Invia Richiesta di Reso
                    </>
                  )}
                </button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
