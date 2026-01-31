import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static Export DISABILITATO - Hostinger usa API PHP
  // ...(isProd && { output: 'export' }),

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
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://gaurosa.it',
  },
};

export default nextConfig;
