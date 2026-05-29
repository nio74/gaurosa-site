/**
 * Cookie consent management (GDPR / Cookie Law italiana).
 *
 * Fonte unica di verità per il consenso cookie dell'utente.
 * - Salva la scelta in localStorage (`cookie_consent`)
 * - Notifica i listener (es. MetaPixel) tramite CustomEvent quando cambia
 *
 * Categorie:
 *  - necessary: sempre true (cookie tecnici, non disattivabili)
 *  - analytics: opzionale (al momento non usato, predisposto per futuro GA4)
 *  - marketing: opzionale (Meta Pixel - remarketing/conversioni)
 */

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'cookie_consent';

/** Evento dispatchato sul window quando il consenso cambia (stessa tab). */
export const CONSENT_EVENT = 'gaurosa-cookie-consent-changed';

/** Legge il consenso salvato. Ritorna null se l'utente non ha ancora deciso. */
export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : '',
    };
  } catch {
    return null;
  }
}

/** Salva il consenso e notifica i listener nella stessa tab. */
export function setConsent(choice: { analytics: boolean; marketing: boolean }): CookieConsent {
  const full: CookieConsent = {
    necessary: true,
    analytics: choice.analytics === true,
    marketing: choice.marketing === true,
    timestamp: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // localStorage non disponibile (private mode estremo): ignora, il banner riapparirà
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: full }));
  }
  return full;
}

/** true se l'utente ha già espresso una scelta (banner non va più mostrato). */
export function hasDecided(): boolean {
  return getConsent() !== null;
}

/** true se l'utente ha acconsentito ai cookie di marketing (Meta Pixel). */
export function hasMarketingConsent(): boolean {
  return getConsent()?.marketing === true;
}

/** true se l'utente ha acconsentito ai cookie analitici. */
export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}
