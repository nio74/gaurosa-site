import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Modulo Incisioni',
  description: 'Richiedi un’incisione personalizzata sui tuoi gioielli Gaurosa con il modulo dedicato.',
  alternates: { canonical: '/modulo-incisioni/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
