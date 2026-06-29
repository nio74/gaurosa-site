import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Modulo Cambio Taglia',
  description: 'Richiedi il cambio taglia del tuo anello Gaurosa compilando il modulo dedicato.',
  alternates: { canonical: '/modulo-cambio-taglia/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
