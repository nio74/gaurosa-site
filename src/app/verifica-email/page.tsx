'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error');
        setMessage('Token di verifica mancante');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.alreadyVerified) {
            setStatus('already_verified');
            setMessage('Il tuo account era già stato verificato.');
          } else {
            setStatus('success');
            setMessage('Account verificato con successo!');
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Errore durante la verifica');
        }
      } catch {
        setStatus('error');
        setMessage('Errore di connessione. Riprova più tardi.');
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      {/* Loading */}
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifica in corso...
          </h1>
          <p className="text-gray-500">
            Stiamo verificando il tuo account
          </p>
        </>
      )}

      {/* Success */}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verificata!
          </h1>
          <p className="text-gray-500 mb-6">
            {message} Ora puoi accedere al tuo account.
          </p>
          <Link href="/account">
            <Button size="lg" className="w-full">
              Accedi al tuo account
            </Button>
          </Link>
        </>
      )}

      {/* Already Verified */}
      {status === 'already_verified' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Già Verificato
          </h1>
          <p className="text-gray-500 mb-6">
            {message}
          </p>
          <Link href="/account">
            <Button size="lg" className="w-full">
              Vai al login
            </Button>
          </Link>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifica Fallita
          </h1>
          <p className="text-gray-500 mb-6">
            {message}
          </p>

          <div className="space-y-3">
            <Link href="/account">
              <Button variant="outline" size="lg" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Richiedi nuovo link
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="lg" className="w-full">
                Torna alla home
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Caricamento...
      </h1>
    </div>
  );
}

export default function VerificaEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={<LoadingFallback />}>
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
