import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/hooks/useCart';
import MetaPixel from '@/components/MetaPixel';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaurosa.it';

// Dati strutturati JewelryStore/LocalBusiness (sitewide) — segnale E-E-A-T per la ricerca AI.
// NAP allineato a Footer / pagina Contatti.
const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  '@id': `${SITE_URL}/#business`,
  name: 'Gaurosa - Gioielleria Mazzon',
  url: SITE_URL,
  telephone: '+393926191199',
  email: 'info@gaurosa.it',
  vatID: 'IT05120880280',
  priceRange: '€€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Via Don G. Carrara, 19',
    addressLocality: 'Villa del Conte',
    postalCode: '35010',
    addressRegion: 'PD',
    addressCountry: 'IT',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '12:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '15:30',
      closes: '19:30',
    },
  ],
  sameAs: [
    'https://www.instagram.com/gaurosaofficial/',
    'https://www.facebook.com/gaurosaofficial',
    'https://www.youtube.com/@gaurosamadeinitaly4556',
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        <MetaPixel />
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-16 lg:pt-20">{children}</main>
            <Footer />
          </div>
        </CartProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
