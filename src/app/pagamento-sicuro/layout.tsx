import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Pagamento Sicuro',
  description: 'Acquista in sicurezza su Gaurosa: pagamenti protetti con crittografia tramite Stripe e PayPal.',
  alternates: { canonical: '/pagamento-sicuro/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
