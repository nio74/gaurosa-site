import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Chi Siamo',
  description: 'La storia di Gaurosa - Gioielleria Mazzon: passione e qualità nella gioielleria dal 1990, a Villa del Conte (PD).',
  alternates: { canonical: '/chi-siamo/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
