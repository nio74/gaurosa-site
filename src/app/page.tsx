'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';

// Categorie in evidenza
const categories = [
  {
    name: 'Gioielli',
    description: 'Collane, anelli, bracciali e orecchini',
    href: '/prodotti?categoria=gioielleria',
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
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background - Simone sostituirà con immagine reale */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight"
          >
            L&apos;eleganza che
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
              ti distingue
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Scopri la nostra collezione esclusiva di gioielli e orologi.
            Qualità, stile e passione dal 1990.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/prodotti">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Esplora la Collezione
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/chi-siamo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                Chi Siamo
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
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
                <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white rounded-full mb-4">
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
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Iscriviti alla Newsletter
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Resta aggiornato sulle novità, offerte esclusive e eventi speciali.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="La tua email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="bg-white text-black hover:bg-gray-100">
                Iscriviti
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
