import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Resi e Rimborsi',
  description: 'Politica di reso Gaurosa: come restituire un prodotto e ottenere il rimborso. Reso facile e veloce.',
  alternates: { canonical: '/resi/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
