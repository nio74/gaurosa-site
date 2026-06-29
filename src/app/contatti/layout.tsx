import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contatti',
  description: 'Contatta Gaurosa - Gioielleria Mazzon: indirizzo, telefono, email e orari del negozio a Villa del Conte (PD).',
  alternates: { canonical: '/contatti/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
