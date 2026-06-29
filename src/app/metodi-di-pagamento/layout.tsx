import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Metodi di Pagamento',
  description: 'Metodi di pagamento accettati su Gaurosa: carte di credito, PayPal e bonifico. Pagamenti sicuri e protetti.',
  alternates: { canonical: '/metodi-di-pagamento/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
