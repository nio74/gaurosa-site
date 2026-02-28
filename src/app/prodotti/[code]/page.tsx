import { Suspense, use } from 'react';
import ProductDetailClient from './ProductDetailClient';

// In static export, only pre-generated pages exist.
// dynamicParams = false → any code not in generateStaticParams returns 404.
// We fetch ALL synced product codes from the API at build time.
export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaurosa.it';

    // Fetch all products (up to 1000) to get their codes
    const res = await fetch(`${siteUrl}/api/products.php?limit=1000&offset=0`, {
      // No cache: always fresh at build time
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[generateStaticParams] API returned', res.status, '— falling back to empty list');
      return [];
    }

    const json = await res.json();
    const products: Array<{ code: string }> = json?.data?.products ?? [];

    console.log(`[generateStaticParams] Pre-generating ${products.length} product pages`);

    return products.map((p) => ({ code: p.code }));
  } catch (err) {
    console.error('[generateStaticParams] Failed to fetch product codes:', err);
    // Return empty — no product pages will be pre-generated (build still succeeds)
    return [];
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <ProductDetailClient code={code} />
    </Suspense>
  );
}


