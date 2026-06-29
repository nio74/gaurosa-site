import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie policy di Gaurosa: quali cookie utilizziamo e come gestire le tue preferenze.',
  alternates: { canonical: '/cookie/' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
