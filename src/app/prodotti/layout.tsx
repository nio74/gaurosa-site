import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Gioielli e Orologi',
  description: 'Scopri la collezione Gaurosa di gioielli e orologi: anelli, collane, bracciali, orecchini e orologi di qualità. Spedizione in tutta Italia e reso facile.',
  alternates: { canonical: '/prodotti/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
