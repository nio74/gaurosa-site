'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  index?: number; // Per animazioni staggered
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();

  const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
  // Use thumb for card (200px, perfect for cards), fallback to original url
  const imageUrl = primaryImage?.url_thumb || primaryImage?.url || '/images/placeholder-product.jpg';
  const blurDataUrl = primaryImage?.blur_data_uri;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link href={`/prodotti/${product.code}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          {/* Immagine prodotto */}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder={blurDataUrl ? "blur" : "empty"}
            blurDataURL={blurDataUrl || undefined}
          />

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          {/* Badge stato */}
          {!product.stock.available && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Esaurito
            </div>
          )}

          {/* Badge sconto (se compare_at_price > price) */}
          {product.stock.available && product.compare_at_price && product.compare_at_price > product.price && (
            <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
            </div>
          )}

          {/* Azioni hover */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Button
              onClick={handleAddToCart}
              disabled={!product.stock.available}
              className="flex-1"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Aggiungi
            </Button>
            <Button variant="secondary" size="sm" className="px-3">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info prodotto */}
        <div className="mt-4 space-y-1">
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            {product.supplier || product.macro_category}
          </p>
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
