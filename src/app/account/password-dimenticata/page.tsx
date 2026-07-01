'use client';

import { useState } from 'react';
import Link from '@/components/ui/Link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PasswordDimenticataPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [devEmailNotFound, setDevEmailNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Errore durante la richiesta');
      }

      setSuccess(true);
      // In dev mode il backend ritorna anche il link reset per facilitare il test
      if (data.dev_reset_url) {
        setDevResetUrl(data.dev_reset_url);
      }
      // In dev mode il backend dice se l'email non esiste (in prod sarebbe oscurato per security)
      if (data.dev_email_not_found) {
        setDevEmailNotFound(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Riprova più tardi';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-rose mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna al login
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-6 h-6 text-brand-rose" />
            <h1 className="text-2xl font-bold text-gray-900">Password dimenticata</h1>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Inserisci il tuo indirizzo email. Ti invieremo un link per impostare o reimpostare la password.
          </p>

          {success ? (
            // SUCCESS STATE
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">Richiesta inviata</p>
                  <p className="mt-1">
                    Se l&apos;indirizzo <strong>{email}</strong> è registrato, riceverai a breve un&apos;email
                    con il link per impostare la password. Controlla anche la cartella spam.
                  </p>
                </div>
              </div>

              {/* In dev mode mostra il link direttamente per facilitare il test */}
              {devResetUrl && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-yellow-900 mb-2">🛠️ Modalità sviluppo</p>
                  <p className="text-yellow-800 mb-3">
                    L&apos;email non viene inviata in localhost. Usa il link qui sotto per testare:
                  </p>
                  <a
                    href={devResetUrl}
                    className="block break-all text-brand-rose hover:underline font-mono text-xs"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              {/* Avviso DEV: email non esiste nel DB locale */}
              {devEmailNotFound && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-orange-900 mb-2">⚠️ Email non trovata (solo dev)</p>
                  <p className="text-orange-800">
                    L&apos;indirizzo <strong>{email}</strong> non esiste nel database locale di sviluppo.
                    In produzione l&apos;utente vedrebbe lo stesso messaggio verde &quot;Richiesta inviata&quot; per security
                    (anti-enumeration). Per testare in locale prova un&apos;email esistente, ad esempio dopo aver fatto
                    un guest checkout.
                  </p>
                </div>
              )}

              <Link href="/account">
                <Button variant="outline" className="w-full">
                  Torna al login
                </Button>
              </Link>
            </div>
          ) : (
            // FORM
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isLoading}
                    placeholder="la-tua-email@esempio.it"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose/50 disabled:bg-gray-100"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  'Invia link'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
