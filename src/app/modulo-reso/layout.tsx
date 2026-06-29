import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Modulo di Reso',
  description: 'Compila il modulo di reso Gaurosa per restituire un prodotto e richiedere il rimborso.',
  alternates: { canonical: '/modulo-reso/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
