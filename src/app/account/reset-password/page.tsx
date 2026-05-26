'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TokenInfo {
  valid: boolean;
  email?: string;
  firstName?: string | null;
  isFirstTime?: boolean;
  error?: string;
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  // Stato verifica token
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [verifying, setVerifying] = useState(true);

  // Form state
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica token al mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token.php?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setTokenInfo({
          valid: data.valid === true,
          email: data.email,
          firstName: data.firstName,
          isFirstTime: data.isFirstTime,
          error: data.error,
        });
      } catch {
        setTokenInfo({ valid: false, error: 'Errore di connessione' });
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenInfo({ valid: false, error: 'Token mancante' });
      setVerifying(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Le password non coincidono');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Errore durante l\'aggiornamento');
      }

      setSuccess(true);
      // Redirect a login dopo 3 secondi
      setTimeout(() => {
        router.push('/account');
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Riprova più tardi';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading verifica token
  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-rose mb-3" />
          <p className="text-gray-600">Verifica del link in corso...</p>
        </div>
      </div>
    );
  }

  // Token invalido / scaduto / usato
  if (!tokenInfo?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Link non valido</p>
              <p className="text-sm text-red-800 mt-1">
                {tokenInfo?.error || 'Il link non è più attivo'}. Richiedi un nuovo link.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/account/password-dimenticata">
              <Button className="w-full">Richiedi nuovo link</Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" className="w-full">Torna al login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success - password impostata/cambiata
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tokenInfo.isFirstTime ? 'Password impostata!' : 'Password aggiornata!'}
          </h1>
          <p className="text-gray-600 mb-6">
            Ora puoi accedere al tuo account con la nuova password. Verrai reindirizzato/a al login...
          </p>
          <Link href="/account">
            <Button className="w-full">Vai al login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // UX dinamica: testo cambia in base a "prima volta" o "reset"
  const isFirstTime = tokenInfo.isFirstTime === true;
  const pageTitle = isFirstTime ? 'Imposta la tua password' : 'Reimposta la tua password';
  const pageDescription = isFirstTime
    ? `Stai impostando la password per il tuo account ${tokenInfo.email}. Questa sarà la tua password per accedere al sito.`
    : `Scegli una nuova password per il tuo account ${tokenInfo.email}.`;
  const buttonLabel = isFirstTime ? 'Imposta password' : 'Cambia password';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-6 h-6 text-brand-rose" />
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        <p className="text-gray-600 text-sm mb-6">{pageDescription}</p>

        {isFirstTime && (
          <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            👋 È la prima volta che imposti una password. Dopo l&apos;aver completato potrai accedere al tuo account
            e visualizzare lo storico ordini.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nuova password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="Minimo 8 caratteri"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose/50 disabled:bg-gray-100"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
              Conferma password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="Ripeti la password"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose/50 disabled:bg-gray-100"
                autoComplete="new-password"
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
            disabled={isLoading || !password || !passwordConfirm}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-rose" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}
