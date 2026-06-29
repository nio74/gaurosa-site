import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Come Acquistare',
  description: 'Come acquistare su Gaurosa: guida semplice per ordinare gioielli e orologi online in modo sicuro.',
  alternates: { canonical: '/come-acquistare/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
