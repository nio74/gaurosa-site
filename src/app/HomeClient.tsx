'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from '@/components/ui/Link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Shield, Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// Trust cards — perché scegliere Gaurosa
// Card statiche (non cliccabili) con foto reali del negozio Gaurosa.
// I file vanno salvati in public/images/cards/ con questi nomi esatti.
const trustCards = [
  {
    title: 'Gioielleria dal 1960',
    description: 'Oltre 60 anni di esperienza nella gioielleria e nella selezione di preziosi.',
    img: '/images/cards/card-1.jpg', // orafo al banco
    imgAlt: 'Orafo Gaurosa al lavoro su un anello al banco di lavoro',
  },
  {
    title: 'Confezione Regalo Inclusa',
    description: 'Ogni gioiello arriva in una confezione elegante, pronta da regalare.',
    img: '/images/cards/card-2.jpg', // packaging rosa
    imgAlt: 'Confezioni regalo eleganti Gaurosa: scatole, sacchetti e certificato di garanzia',
  },
  {
    title: 'Assistenza Reale',
    description: 'Ti aiutiamo nella scelta prima e dopo l’acquisto anche tramite WhatsApp.',
    img: '/images/cards/card-3.jpg', // bancone negozio
    imgAlt: 'Interno della gioielleria Gaurosa con il bancone e le vetrine',
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
    description: 'Su tutti gli ordini sopra i 45€',
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
                Gioielli che <span className="text-brand-rose">emozionano</span>
                <br />
                da 60 anni
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl text-gray-700 max-w-xl"
              >
                Scopri le collezioni Gaurosa selezionate dalla famiglia Mazzon
                per celebrare ogni momento speciale.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link href="/prodotti">
                  <Button size="lg" className="bg-brand-rose text-white hover:bg-brand-rose-dark">
                    Scopri le Collezioni
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

      {/* Trust Cards — Perché scegliere Gaurosa */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Perché scegliere Gaurosa
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Esperienza, cura e assistenza reale prima e dopo l’acquisto.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
            {trustCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                {/* Card statica — non cliccabile, solo visual + testo.
                    Niente aspect-ratio rigido: usiamo min-height scalabile.
                    Su mobile (full width) -> landscape. Su lg (1/3 width) -> quasi quadrata o leggermente landscape su monitor grandi. */}
                <div className="relative min-h-[260px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[460px] xl:min-h-[500px] overflow-hidden rounded-2xl bg-gray-200 transition-shadow duration-300 group-hover:shadow-xl">
                  {/* Layer 1 — Foto reale */}
                  <Image
                    src={card.img}
                    alt={card.imgAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Layer 2 — Gradient scuro in basso per leggibilità testo bianco */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                  {/* Layer 3 — Testo ancorato in basso */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
                    <h3 className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-white drop-shadow-lg leading-tight">
                      {card.title}
                    </h3>
                    <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-white/90 drop-shadow-md leading-snug">
                      {card.description}
                    </p>
                  </div>
                </div>
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
              Ricevi offerte esclusive
            </h2>
            <p className="mt-4 text-brand-pink/70 max-w-xl mx-auto">
              Iscriviti alla newsletter e ottieni subito un{' '}
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
