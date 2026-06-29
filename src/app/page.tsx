import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  description:
    'Gaurosa - Gioielleria Mazzon: gioielli e orologi selezionati. Anelli, collane, bracciali, orecchini e orologi di qualità, dal 1990. Spedizione in tutta Italia e reso facile.',
  alternates: { canonical: '/' },
};

export default function Page() {
  return <HomeClient />;
}
