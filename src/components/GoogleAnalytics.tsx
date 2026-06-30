'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getConsent, CONSENT_EVENT } from '@/lib/cookieConsent';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Measurement ID GA4 (formato G-XXXXXXXXXX). Vuoto = disattivato (no-op).
const GA_ID = 'G-BLP92S8359';

/**
 * GoogleAnalytics — da montare una sola volta in layout.tsx.
 *
 * GDPR: lo script gtag.js viene caricato SOLO se l'utente ha dato il consenso
 * "analitici" tramite il CookieBanner. Finché non c'è consenso, `window.gtag`
 * resta undefined e nulla viene tracciato. Reagisce in tempo reale al cambio di
 * consenso (CONSENT_EVENT). Stesso pattern del Meta Pixel.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  // Consenso iniziale + iscrizione ai cambiamenti
  useEffect(() => {
    const update = () => setAnalyticsAllowed(getConsent()?.analytics === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  // page_view ad ogni navigazione SPA, solo se attivo
  useEffect(() => {
    if (!GA_ID || !analyticsAllowed) return;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
  }, [pathname, analyticsAllowed]);

  if (!GA_ID || !analyticsAllowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `,
        }}
      />
    </>
  );
}
