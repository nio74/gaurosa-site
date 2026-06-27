#!/usr/bin/env node
/**
 * Genera public/sitemap.xml a build-time.
 *
 * - Pagine statiche: lista curata con changefreq/priority.
 * - Prodotti: recuperati dall'API (stesso endpoint di generateStaticParams).
 * - URL sempre con trailing slash (coerente con next.config trailingSlash: true).
 * - URL sempre sul dominio di produzione (la sitemap è un artefatto di produzione).
 *
 * Override base via env SITEMAP_BASE_URL (default https://gaurosa.it).
 * Se l'API non è raggiungibile, scrive comunque le pagine statiche (build non bloccato).
 *
 * Eseguito come `prebuild` (vedi package.json) → public/sitemap.xml finisce in out/.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = (process.env.SITEMAP_BASE_URL || 'https://gaurosa.it').replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

// Pagine statiche indicizzabili (NO aree transazionali: carrello/checkout/ordine/account)
const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/prodotti/', changefreq: 'daily', priority: '0.9' },
  { path: '/chi-siamo/', changefreq: 'monthly', priority: '0.6' },
  { path: '/contatti/', changefreq: 'monthly', priority: '0.6' },
  { path: '/come-acquistare/', changefreq: 'monthly', priority: '0.5' },
  { path: '/metodi-di-pagamento/', changefreq: 'monthly', priority: '0.5' },
  { path: '/pagamento-sicuro/', changefreq: 'monthly', priority: '0.5' },
  { path: '/spedizioni/', changefreq: 'monthly', priority: '0.5' },
  { path: '/resi/', changefreq: 'monthly', priority: '0.5' },
  { path: '/recesso/', changefreq: 'yearly', priority: '0.4' },
  { path: '/guida-misura-anelli/', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookie/', changefreq: 'yearly', priority: '0.3' },
  { path: '/termini/', changefreq: 'yearly', priority: '0.3' },
];

async function fetchProductCodes() {
  const codes = [];
  const limit = 1000;
  let offset = 0;
  // Pagina finché l'API restituisce un blocco pieno (robusto oltre i 1000 prodotti)
  for (let page = 0; page < 50; page++) {
    const url = `${BASE}/api/products.php?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API ${res.status} su ${url}`);
    const json = await res.json();
    const products = json?.data?.products ?? [];
    for (const p of products) if (p?.code) codes.push(p.code);
    if (products.length < limit) break;
    offset += limit;
  }
  return codes;
}

function urlEntry(loc, changefreq, priority, lastmod = TODAY) {
  return [
    '  <url>',
    `    <loc>${BASE}${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

async function main() {
  const entries = STATIC_PAGES.map((p) => urlEntry(p.path, p.changefreq, p.priority));

  try {
    const codes = await fetchProductCodes();
    console.log(`[sitemap] ${codes.length} prodotti aggiunti`);
    for (const code of codes) {
      entries.push(urlEntry(`/prodotti/${encodeURIComponent(code)}/`, 'weekly', '0.8'));
    }
  } catch (err) {
    console.warn(`[sitemap] ⚠️  Prodotti non recuperati (${err.message}) — scrivo solo pagine statiche`);
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml');
  await writeFile(outPath, xml, 'utf8');
  console.log(`[sitemap] Scritto ${outPath} (${entries.length} URL totali)`);
}

main().catch((err) => {
  console.error('[sitemap] Errore fatale:', err);
  process.exit(1);
});
