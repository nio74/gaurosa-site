'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data);
        } else {
          setError('Prodotto non trovato');
        }
      } catch {
        setError('Errore nel caricamento del prodotto');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">{error || 'Prodotto non trovato'}</p>
        <Link href="/prodotti">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna ai prodotti
          </Button>
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0
    ? product.images
    : [{ url: '/images/placeholder-product.jpg', is_primary: true, position: 0 }];

  const handleAddToCart = () => {
    addToCart(product, selectedVariant ? product.variants?.find(v => v.sku === selectedVariant) : undefined);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/prodotti" className="text-gray-500 hover:text-gray-700">
            Prodotti
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={images[selectedImage].url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Out of stock badge */}
              {!product.stock.available && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Esaurito
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            {/* Brand */}
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              {product.supplier || product.macro_category}
            </p>

            {/* Name */}
            <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Code */}
            <p className="mt-2 text-sm text-gray-400">
              Codice: {product.code}
              {product.ean && ` | EAN: ${product.ean}`}
            </p>

            {/* Price */}
            <p className="mt-6 text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </p>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Descrizione</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Seleziona taglia</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.sku}
                      onClick={() => setSelectedVariant(variant.sku)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        selectedVariant === variant.sku
                          ? 'border-black bg-black text-white'
                          : variant.stock > 0
                          ? 'border-gray-200 hover:border-gray-400'
                          : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {variant.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.stock.available}
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock.available ? 'Aggiungi al carrello' : 'Non disponibile'}
              </Button>
              <Button variant="outline" size="lg" className="px-4">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Shipping info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Spedizione</p>
                  <p className="text-gray-600">Gratuita sopra 100EUR</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Consegna</p>
                  <p className="text-gray-600">2-4 giorni lavorativi</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
