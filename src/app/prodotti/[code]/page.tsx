import { Suspense, use } from 'react';
import ProductDetailClient from './ProductDetailClient';

// Static export strategy:
// - Pre-generate pages for all currently synced products (fetched from API at build time)
// - Always include a "_shell" placeholder so the .htaccess fallback can serve it
//   for any product code not yet pre-generated (newly synced products work without rebuild)
// - dynamicParams is NOT set to false, so unknown codes don't hard-404 at Next.js level

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

export default function ProductDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <ProductDetailClient code={code} />
    </Suspense>
  );
}


