import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Guida alle Misure degli Anelli',
  description: 'Come misurare la taglia dell’anello: guida pratica Gaurosa per trovare la misura giusta del tuo anello.',
  alternates: { canonical: '/guida-misura-anelli/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
