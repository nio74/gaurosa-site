'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { getConsent, CONSENT_EVENT } from '@/lib/cookieConsent';

// Project ID di Microsoft Clarity. Vuoto = disattivato (no-op).
const CLARITY_ID = 'xfo6ipfzcs';

/**
 * ClarityAnalytics — da montare una sola volta in layout.tsx.
 *
 * GDPR: lo script Clarity (heatmap + registrazioni sessioni) viene caricato SOLO se
 * l'utente ha dato il consenso "analitici" tramite il CookieBanner. Reagisce in tempo
 * reale al cambio di consenso (CONSENT_EVENT). Stesso pattern di GA4 / Meta Pixel.
 */
export default function ClarityAnalytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const update = () => setAnalyticsAllowed(getConsent()?.analytics === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  if (!CLARITY_ID || !analyticsAllowed) return null;

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  );
}
