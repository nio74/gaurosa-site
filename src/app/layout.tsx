import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/hooks/useCart';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Gaurosa - Gioielli e Orologi',
    template: '%s | Gaurosa',
  },
  description:
    'Scopri la nostra collezione di gioielli e orologi selezionati. Qualità, eleganza e passione dal 1990.',
  keywords: ['gioielli', 'orologi', 'gioielleria', 'accessori', 'oro', 'argento'],
  authors: [{ name: 'Gaurosa' }],
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://gaurosa.it',
    siteName: 'Gaurosa',
    title: 'Gaurosa - Gioielli e Orologi',
    description: 'Scopri la nostra collezione di gioielli e orologi selezionati.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.className} antialiased`}>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-16 lg:pt-20">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
