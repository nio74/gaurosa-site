import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Spedizioni',
  description: 'Spedizioni Gaurosa: tempi, costi e modalità di consegna dei tuoi gioielli e orologi in tutta Italia.',
  alternates: { canonical: '/spedizioni/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
