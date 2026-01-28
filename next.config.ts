import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ottimizzazioni per produzione Hostinger
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mazgest.org',
        pathname: '/uploads/**',
      },
    ],
  },

  // Variabili ambiente esposte al client
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://gaurosa.it',
  },
};

export default nextConfig;
