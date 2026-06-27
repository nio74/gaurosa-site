import { Suspense, cache } from 'react';
import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

// Static export strategy:
// - Pre-generate pages for all currently synced products (fetched from API at build time)
// - Always include a "_shell" placeholder so the .htaccess fallback can serve it
//   for any product code not yet pre-generated (newly synced products work without rebuild)
// - dynamicParams is NOT set to false, so unknown codes don't hard-404 at Next.js level

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaurosa.it';

interface ProductSeo {
  code: string;
  ean?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  main_category?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  price?: number | null;
  stock?: { available?: boolean };
  images?: Array<{ url: string; is_primary?: boolean }>;
}

// Fetch a single product at build time. Wrapped in React cache() so generateMetadata
// and the page component share one fetch per product (no duplicate API calls).
const getProduct = cache(async (code: string): Promise<ProductSeo | null> => {
  if (!code || code === '_shell') return null;
  try {
    // force-cache (non no-store): in output:'export' i fetch di rendering devono essere
    // statici, altrimenti vengono trattati come dinamici e falliscono in fase di export.
    const res = await fetch(`${SITE_URL}/api/product.php?code=${encodeURIComponent(code)}`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? (json.data as ProductSeo) : null;
  } catch {
    return null;
  }
});

function plainText(html: string | null | undefined, max = 155): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function primaryImage(p: ProductSeo): string | undefined {
  return p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url;
}

export async function generateStaticParams() {
  // Always include the shell placeholder
  const params: Array<{ code: string }> = [{ code: '_shell' }];

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaurosa.it';

    // Fetch all synced products to pre-generate their pages
    const res = await fetch(`${siteUrl}/api/products.php?limit=1000&offset=0`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const products: Array<{ code: string }> = json?.data?.products ?? [];
      console.log(`[generateStaticParams] Pre-generating ${products.length} product pages + shell`);
      products.forEach((p) => params.push({ code: p.code }));
    } else {
      console.warn('[generateStaticParams] API returned', res.status, '— only shell generated');
    }
  } catch (err) {
    console.error('[generateStaticParams] Failed to fetch product codes:', err);
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const p = await getProduct(code);

  // Shell placeholder or unknown product → don't index empty/duplicate content
  if (!p) {
    return { title: 'Prodotto', robots: { index: false, follow: true } };
  }

  const url = `/prodotti/${code}/`;
  const name = p.name?.trim() || 'Prodotto';
  // Non ripetere il brand quando coincide col negozio (il template aggiunge già "| Gaurosa")
  const showBrand = p.brand && p.brand.trim().toLowerCase() !== 'gaurosa' ? p.brand.trim() : '';
  const title = p.seo_title?.trim() || `${name}${showBrand ? ` · ${showBrand}` : ''}`;
  const description =
    plainText(p.seo_description) ||
    plainText(p.description) ||
    `${name}${showBrand ? ` di ${showBrand}` : ''} disponibile su Gaurosa - Gioielleria Mazzon. Spedizione e reso facile.`;
  const img = primaryImage(p);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: img ? [img] : undefined,
    },
  };
}

function abs(u: string): string {
  if (!u) return u;
  return /^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

function buildJsonLd(p: ProductSeo, code: string) {
  const url = `${SITE_URL}/prodotti/${code}/`;
  const images = (p.images ?? []).map((i) => abs(i.url)).filter(Boolean);
  const hasPrice = typeof p.price === 'number' && p.price > 0;

  const product: Record<string, unknown> = {
    '@type': 'Product',
    name: p.name,
    description: plainText(p.description, 5000) || p.name,
    sku: p.code,
    url,
    ...(images.length ? { image: images } : {}),
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    ...(p.ean && /^\d{13}$/.test(p.ean) ? { gtin13: p.ean } : {}),
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'EUR',
            price: p.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: p.stock?.available
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            seller: { '@id': `${SITE_URL}/#business` },
          },
        }
      : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Prodotti', item: `${SITE_URL}/prodotti/` },
      { '@type': 'ListItem', position: 3, name: p.name, item: url },
    ],
  };

  return { '@context': 'https://schema.org', '@graph': [product, breadcrumb] };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const p = await getProduct(code);

  return (
    <>
      {p && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(p, code)) }}
        />
      )}
      <Suspense fallback={<div>Caricamento...</div>}>
        <ProductDetailClient code={code} />
      </Suspense>
    </>
  );
}
