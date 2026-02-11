import Link from 'next/link';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'Tutti i Prodotti', href: '/prodotti' },
    { name: 'Anelli', href: '/prodotti?sottocategoria=anello' },
    { name: 'Bracciali', href: '/prodotti?sottocategoria=bracciale' },
    { name: 'Collane', href: '/prodotti?sottocategoria=collana' },
    { name: 'Orecchini', href: '/prodotti?sottocategoria=orecchini' },
  ],
  info: [
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Contatti', href: '/contatti' },
    { name: 'Spedizioni', href: '/spedizioni' },
    { name: 'Resi e Garanzia', href: '/resi' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Termini e Condizioni', href: '/termini' },
    { name: 'Cookie Policy', href: '/cookie' },
  ],
};

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/gaurosaofficial/', label: 'Instagram' },
  { icon: Facebook, href: 'https://www.facebook.com/gaurosaofficial', label: 'Facebook' },
  { icon: Youtube, href: 'https://www.youtube.com/@gaurosamadeinitaly4556', label: 'YouTube' },
  { icon: MessageCircle, href: 'https://wa.me/+393926191199', label: 'WhatsApp' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">GAUROSA</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Gioielli artigianali di qualità, realizzati a mano con passione. 
              Dal produttore al consumatore dal 1960.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Informazioni
            </h3>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contatti
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Via Don G. Carrara, 19<br />35010 Villa del Conte (PD)</span>
              </li>
              <li>
                <a
                  href="tel:+393926191199"
                  className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>+39 392 619 1199</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@gaurosa.it"
                  className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>info@gaurosa.it</span>
                </a>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Lun - Sab: 9:00 - 12:30 | 15:30 - 19:30
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-400">
                &copy; {currentYear} Gaurosa - marchio di proprietà della Mazzon Gioielli S.N.C.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                P.IVA IT05120880280 | Via Don G. Carrara, 19 - 35010 Villa del Conte (PD) - Italia
              </p>
            </div>
            <div className="flex gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
