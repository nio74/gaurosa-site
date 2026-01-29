import { Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';

type Props = {
  params: Promise<{ slug: string }>;
};

// IMPORTANTE: generateStaticParams per static export
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Ritorna array vuoto - pagine prodotto generate client-side
  return [];
}

// dynamicParams false = 404 per slug non in generateStaticParams
export const dynamicParams = false;

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
      </div>
    }>
      <ProductDetailClient />
    </Suspense>
  );
}
