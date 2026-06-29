import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Termini e Condizioni',
  description: 'Termini e condizioni di vendita di Gaurosa - Gioielleria Mazzon: condizioni di acquisto, garanzie e diritti del consumatore.',
  alternates: { canonical: '/termini/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
