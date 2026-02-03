import { Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';

// Genera parametri statici per l'export
export async function generateStaticParams() {
  // Per l'export statico, generiamo solo alcune pagine di esempio
  // Le altre saranno renderizzate client-side
  return [
    { code: 'M01012' },
    { code: 'M01013' },
    { code: 'M01022' },
  ];
}

export default function ProductDetailPage({ params }: { params: { code: string } }) {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <ProductDetailClient code={params.code} />
    </Suspense>
  );
}


