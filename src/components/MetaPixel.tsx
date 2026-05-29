'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getConsent, CONSENT_EVENT } from '@/lib/cookieConsent';

// Extend window to include fbq
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

/**
 * Helper to fire Meta Pixel events safely.
 * Can be called from any client component after MetaPixel is mounted.
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

export function trackCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, params);
  }
}

/**
 * MetaPixel component — add once in layout.tsx.
 *
 * GDPR: lo script Meta Pixel viene caricato SOLO se l'utente ha dato il consenso
 * marketing tramite il CookieBanner. Finché non c'è consenso, `window.fbq` resta
 * undefined: tutte le chiamate fbq sparse nel sito (AddToCart, ViewContent, Purchase,
 * InitiateCheckout) sono già protette da `typeof window.fbq === 'function'` e quindi
 * diventano automaticamente no-op. Il gating qui è quindi la fonte unica di controllo.
 *
 * Reagisce in tempo reale al cambio di consenso (CONSENT_EVENT): se l'utente accetta
 * il marketing, lo script viene montato e PageView parte.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  // Legge il consenso iniziale e si iscrive ai cambiamenti
  useEffect(() => {
    const update = () => setMarketingAllowed(getConsent()?.marketing === true);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  // Fire PageView su ogni navigazione, solo se il pixel è attivo (consenso dato)
  useEffect(() => {
    if (!PIXEL_ID || !marketingAllowed) return;
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, marketingAllowed]);

  if (!PIXEL_ID || !marketingAllowed) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
