'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent } from '@/lib/cookieConsent';

/**
 * Banner consenso cookie GDPR / Cookie Law italiana.
 *
 * Appare al primo accesso (quando non esiste ancora una scelta in localStorage).
 * Blocca il caricamento di Meta Pixel finché l'utente non acconsente al marketing
 * (il gating effettivo è in MetaPixel.tsx, che ascolta il consenso).
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Mostra il banner solo se l'utente non ha ancora deciso
  useEffect(() => {
    if (getConsent() === null) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    setConsent({ analytics: true, marketing: true });
    setVisible(false);
  };

  const rejectAll = () => {
    setConsent({ analytics: false, marketing: false });
    setVisible(false);
  };

  const saveCustom = () => {
    setConsent({ analytics, marketing });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
      role="dialog"
      aria-label="Gestione consenso cookie"
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-brand-pink-border bg-white shadow-2xl">
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-pink-light flex items-center justify-center">
              <Cookie className="w-5 h-5 text-brand-rose" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-brand-text">
                Rispettiamo la tua privacy
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Usiamo cookie tecnici necessari al funzionamento del sito e, previo tuo consenso,
                cookie di marketing (Meta Pixel) per offrirti contenuti pertinenti. Puoi accettare,
                rifiutare o personalizzare. Leggi la{' '}
                <Link href="/cookie" className="text-brand-rose underline hover:text-brand-rose-dark">
                  Cookie Policy
                </Link>{' '}
                e la{' '}
                <Link href="/privacy" className="text-brand-rose underline hover:text-brand-rose-dark">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <button
              onClick={rejectAll}
              aria-label="Chiudi e rifiuta cookie non necessari"
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pannello personalizza */}
          {showCustomize && (
            <div className="mt-4 mb-4 space-y-3 border-t border-gray-100 pt-4">
              {/* Necessari (sempre attivi) */}
              <label className="flex items-center justify-between gap-4 cursor-not-allowed opacity-70">
                <span className="text-sm">
                  <span className="font-medium text-brand-text">Cookie necessari</span>
                  <span className="block text-xs text-gray-500">
                    Essenziali per il funzionamento del sito (sempre attivi).
                  </span>
                </span>
                <input type="checkbox" checked disabled className="h-4 w-4 accent-brand-rose" />
              </label>

              {/* Analitici */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-sm">
                  <span className="font-medium text-brand-text">Cookie analitici</span>
                  <span className="block text-xs text-gray-500">
                    Statistiche anonime di utilizzo per migliorare il sito.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 accent-brand-rose"
                />
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-sm">
                  <span className="font-medium text-brand-text">Cookie di marketing</span>
                  <span className="block text-xs text-gray-500">
                    Meta Pixel (Facebook) per remarketing e misurazione conversioni.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4 accent-brand-rose"
                />
              </label>
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-2">
            {!showCustomize ? (
              <button
                onClick={() => setShowCustomize(true)}
                className="order-3 sm:order-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Personalizza
              </button>
            ) : (
              <button
                onClick={saveCustom}
                className="order-3 sm:order-1 px-4 py-2.5 text-sm font-medium text-brand-rose border border-brand-rose rounded-lg hover:bg-brand-pink-light transition-colors"
              >
                Salva preferenze
              </button>
            )}
            <button
              onClick={rejectAll}
              className="order-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Solo necessari
            </button>
            <button
              onClick={acceptAll}
              className="order-1 sm:order-3 px-5 py-2.5 text-sm font-semibold text-white bg-brand-rose rounded-lg hover:bg-brand-rose-dark transition-colors"
            >
              Accetta tutto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
