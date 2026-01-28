import Link from 'next/link';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'Gioielli', href: '/prodotti?categoria=gioielleria' },
    { name: 'Orologi', href: '/prodotti?categoria=orologi' },
    { name: 'Accessori', href: '/prodotti?categoria=accessori' },
    { name: 'Novità', href: '/prodotti?sort=newest' },
  ],
  info: [
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Contatti', href: '/contatti' },
    { name: 'Spedizioni', href: '/spedizioni' },
    { name: 'Resi e Rimborsi', href: '/resi' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Termini e Condizioni', href: '/termini' },
    { name: 'Cookie Policy', href: '/cookie' },
  ],
};

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
              Gioielli e orologi selezionati con cura. Qualità, eleganza e passione dal 1990.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
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
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Via Roma 123, 35010 Padova</span>
              </li>
              <li>
                <a
                  href="tel:+390491234567"
                  className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>+39 049 123 4567</span>
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
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Gaurosa. Tutti i diritti riservati.
          </p>
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
    </footer>
  );
}
