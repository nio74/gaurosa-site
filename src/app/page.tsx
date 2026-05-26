'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Shield, Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// Categorie in evidenza
const categories = [
  {
    name: 'Gioielli',
    description: 'Collane, anelli, bracciali e orecchini',
    href: '/prodotti',
  },
  {
    name: 'Orologi',
    description: 'Le migliori marche selezionate',
    href: '/prodotti?categoria=orologi',
  },
  {
    name: 'Accessori',
    description: 'Gemelli, spille e molto altro',
    href: '/prodotti?categoria=accessori',
  },
];

// Features del negozio
const features = [
  {
    icon: Sparkles,
    title: 'Qualità Garantita',
    description: 'Selezioniamo solo i migliori prodotti per te',
  },
  {
    icon: Truck,
    title: 'Spedizione Gratuita',
    description: 'Su tutti gli ordini sopra i 100€',
  },
  {
    icon: Shield,
    title: 'Pagamenti Sicuri',
    description: 'Transazioni protette e certificate',
  },
];

export default function HomePage() {
  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);

    if (!newsletterConsent) {
      setNewsletterError('Devi accettare il trattamento dei dati per finalità di marketing.');
      return;
    }

    setNewsletterLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_MAZGEST_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/email-marketing/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          consenso_marketing: newsletterConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore durante l\'iscrizione');
      }
      setNewsletterSuccess(data.message || 'Iscrizione completata!');
      setNewsletterEmail('');
      setNewsletterConsent(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Riprova più tardi';
      setNewsletterError(message);
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section — stack su mobile, overlay split su desktop */}
      <section className="relative flex flex-col md:block md:h-[85vh] md:min-h-[640px] overflow-hidden">
        {/* Immagine — mobile: blocco in alto; desktop: fullscreen di sfondo */}
        <div className="relative w-full h-[55vh] min-h-[360px] md:absolute md:inset-0 md:h-full md:min-h-0">
          <Image
            src="/images/hero-jewelry.jpg"
            alt="Modella che indossa gioielli Gaurosa: orecchini, collana, anello e bracciale"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] md:object-[right_center]"
          />
          {/* Gradient overlay solo su desktop, per leggibilità testo a sinistra */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
        </div>

        {/* Contenuto — mobile: sotto l'immagine; desktop: sovrapposto a sinistra */}
        <div className="relative md:absolute md:inset-0 md:flex md:items-center">
          <div className="container mx-auto px-4 py-12 md:py-0">
            <div className="max-w-xl md:max-w-2xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 leading-tight"
              >
                L&apos;eleganza che
                <br />
                <span className="text-brand-rose">ti distingue</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl text-gray-700 max-w-xl"
              >
                Scopri la nostra collezione esclusiva di gioielli e orologi.
                Qualità, stile e passione dal 1990.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link href="/prodotti">
                  <Button size="lg" className="bg-brand-rose text-white hover:bg-brand-rose-dark">
                    Esplora la Collezione
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/chi-siamo">
                  <Button size="lg" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                    Chi Siamo
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — solo desktop, altrimenti su mobile sta sopra al testo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-3 bg-gray-400 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Le Nostre Categorie
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Esplora le nostre collezioni curate con passione e attenzione ai dettagli
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-200">
                    {/* Placeholder gradient - Simone sostituirà con immagini reali */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {category.name}
                      </h3>
                      <p className="mt-2 text-white/90 drop-shadow-md">
                        {category.description}
                      </p>
                      <div className="mt-4 flex items-center text-white font-medium">
                        <span>Scopri</span>
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-rose text-white rounded-full mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-brand-rose text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Iscriviti alla Newsletter
            </h2>
            <p className="mt-4 text-brand-pink/70 max-w-xl mx-auto">
              Resta aggiornata sulle novità, offerte esclusive e ricevi subito un{' '}
              <strong className="text-white">10% di sconto</strong> sul primo ordine.
            </p>

            {newsletterSuccess ? (
              // Stato successo
              <div className="mt-8 max-w-md mx-auto bg-white/10 border border-white/30 rounded-lg p-6 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold">Grazie!</p>
                  <p className="text-sm text-brand-pink/90 mt-1">{newsletterSuccess}</p>
                </div>
              </div>
            ) : (
              // Form
              <form
                onSubmit={handleNewsletterSubmit}
                className="mt-8 max-w-md mx-auto"
                noValidate
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterError) setNewsletterError(null);
                    }}
                    disabled={newsletterLoading}
                    placeholder="La tua email"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-brand-pink/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 disabled:opacity-50"
                    aria-label="Indirizzo email"
                  />
                  <Button
                    type="submit"
                    disabled={newsletterLoading || !newsletterEmail || !newsletterConsent}
                    className="bg-white text-brand-rose hover:bg-brand-pink-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {newsletterLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Invio...
                      </>
                    ) : (
                      'Iscriviti'
                    )}
                  </Button>
                </div>

                <label className="mt-4 flex items-start gap-2 text-sm text-brand-pink/80 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => {
                      setNewsletterConsent(e.target.checked);
                      if (newsletterError) setNewsletterError(null);
                    }}
                    disabled={newsletterLoading}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer"
                    aria-label="Consenso al trattamento dei dati"
                  />
                  <span>
                    Acconsento al trattamento dei dati per finalità di marketing.{' '}
                    <Link
                      href="/privacy"
                      className="underline hover:text-white"
                      target="_blank"
                    >
                      Leggi la Privacy Policy
                    </Link>
                  </span>
                </label>

                {newsletterError && (
                  <div className="mt-4 bg-red-500/20 border border-red-300/40 rounded-lg p-3 flex items-start gap-2 text-left">
                    <AlertCircle className="w-5 h-5 text-red-100 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-50">{newsletterError}</p>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
