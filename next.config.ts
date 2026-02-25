import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Export statico per Hostinger (solo file HTML/CSS/JS)
  ...(isProd && { 
    output: 'export',
    distDir: 'out',
  }),

  // Disabilita ottimizzazione immagini (non supportata in static export)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mazgest.org',
        pathname: '/uploads/**',
      },
    ],
  },

  // Trailing slash per compatibilità hosting statico
  trailingSlash: true,

  // Variabili ambiente esposte al client
  // NOTA: non sovrascrivere NEXT_PUBLIC_SITE_URL qui — viene già letta da .env.local
  // in sviluppo e da .env.production in produzione. Impostarla qui con || 'https://gaurosa.it'
  // causerebbe il fallback a produzione anche in locale se la variabile non è nel processo.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? (isProd ? 'https://gaurosa.it' : 'http://localhost:3003'),
  },

  // Proxy API calls to XAMPP in development
  // In production, .htaccess handles routing to PHP files
  ...(!isProd && {
    async rewrites() {
      return [
        // API PHP nella cartella /api/ (auth, checkout, orders...)
        {
          source: '/api/:path*',
          destination: 'http://localhost/gaurosa-site/api/:path*',
        },
        // API PHP nella root (api-products.php, api-filters.php, api-product.php, ecc.)
        // Elencate esplicitamente per evitare problemi con la sintassi wildcard
        { source: '/api-products.php', destination: 'http://localhost/gaurosa-site/api-products.php' },
        { source: '/api-product.php', destination: 'http://localhost/gaurosa-site/api-product.php' },
        { source: '/api-filters.php', destination: 'http://localhost/gaurosa-site/api-filters.php' },
        { source: '/api-collections.php', destination: 'http://localhost/gaurosa-site/api-collections.php' },
        { source: '/api-config.php', destination: 'http://localhost/gaurosa-site/api-config.php' },
        // Note: api/sync/*.php files are covered by the /api/:path* rule above
      ];
    },
  }),
};

export default nextConfig;
