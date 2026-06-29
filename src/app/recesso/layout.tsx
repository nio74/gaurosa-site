import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Diritto di Recesso',
  description: 'Diritto di recesso Gaurosa: come esercitare il recesso nei termini di legge e ottenere il rimborso.',
  alternates: { canonical: '/recesso/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
