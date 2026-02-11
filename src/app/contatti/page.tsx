'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Facebook, Youtube } from 'lucide-react';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Indirizzo',
    lines: ['Via Don G. Carrara, 19', '35010 Villa del Conte (PD)', 'Italia'],
    href: 'https://maps.google.com/?q=Via+Don+G.+Carrara+19+Villa+del+Conte+PD',
  },
  {
    icon: Phone,
    title: 'Telefono',
    lines: ['+39 392 619 1199', '+39 049 939 0535'],
    href: 'tel:+393926191199',
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['info@gaurosa.it'],
    href: 'mailto:info@gaurosa.it',
  },
  {
    icon: Clock,
    title: 'Orari di Apertura',
    lines: ['Lun - Sab: 9:00 - 12:30', '15:30 - 19:30', 'Domenica: Chiuso'],
    href: undefined,
  },
];

const socialLinks = [
  {
    icon: Instagram,
    name: 'Instagram',
    handle: '@gaurosaofficial',
    href: 'https://www.instagram.com/gaurosaofficial/',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
  },
  {
    icon: Facebook,
    name: 'Facebook',
    handle: 'Gaurosa Official',
    href: 'https://www.facebook.com/gaurosaofficial',
    color: 'bg-blue-600',
  },
  {
    icon: Youtube,
    name: 'YouTube',
    handle: 'Gaurosa Made in Italy',
    href: 'https://www.youtube.com/@gaurosamadeinitaly4556',
    color: 'bg-red-600',
  },
  {
    icon: MessageCircle,
    name: 'WhatsApp',
    handle: '+39 392 619 1199',
    href: 'https://wa.me/+393926191199',
    color: 'bg-green-500',
  },
];

export default function ContattiPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Contatti
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
              Siamo a tua disposizione per qualsiasi informazione, richiesta o consiglio. 
              Non esitare a contattarci!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {info.href ? (
                  <a
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block h-full p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-xl mb-4 group-hover:scale-110 transition-transform">
                      <info.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                    {info.lines.map((line, i) => (
                      <p key={i} className="text-gray-600 text-sm">{line}</p>
                    ))}
                  </a>
                ) : (
                  <div className="h-full p-6 bg-gray-50 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-xl mb-4">
                      <info.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                    {info.lines.map((line, i) => (
                      <p key={i} className="text-gray-600 text-sm">{line}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mappa + WhatsApp CTA */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mappa */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2791.5!2d11.9!3d45.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zVmlsbGEgZGVsIENvbnRl!5e0!3m2!1sit!2sit!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mazzon Gioielli - Villa del Conte"
              />
            </motion.div>

            {/* WhatsApp CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Scrivici su WhatsApp
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Hai bisogno di un consiglio su un gioiello? Vuoi informazioni su un prodotto 
                o su una lavorazione personalizzata? Scrivici direttamente su WhatsApp, 
                Simone sarà felice di assisterti!
              </p>
              <a
                href="https://wa.me/+393926191199"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                Chatta con Simone
              </a>

              <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Store Manager</p>
                <p className="font-semibold text-gray-900">Simone Mazzon</p>
                <p className="text-sm text-gray-600 mt-1">
                  Disponibile durante gli orari di apertura del negozio
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            Seguici sui Social
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 ${social.color} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <social.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{social.name}</p>
                  <p className="text-xs text-gray-500">{social.handle}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Info Aziendali */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            <strong>Gaurosa</strong> è un marchio di proprietà della <strong>Mazzon Gioielli S.N.C.</strong>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Via Don G. Carrara, 19 - 35010 Villa del Conte (PD) - Italia | P.IVA IT05120880280
          </p>
        </div>
      </section>
    </div>
  );
}
