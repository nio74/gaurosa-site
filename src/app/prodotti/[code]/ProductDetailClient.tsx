'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  ArrowLeft,
  Gem,
  Ruler,
  Award,
  Package
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { fetchProduct } from '@/lib/api';
import { useCart } from '@/hooks/useCart';

// Tipo prodotto completo
interface ProductDetail {
  id: number;
  code: string;
  ean: string | null;
  name: string;
  slug: string;
  description: string | null;
  load_type: string;
  main_category: string | null;
  subcategory: string | null;
  supplier: string;
  brand: string;
  price: number;
  compare_at_price: number | null;
  stock: {
    total: number;
    available: boolean;
    status: string;
  };
  images: Array<{
    url: string;
    is_primary: boolean;
    position: number;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    name: string | null;
    attribute_name: string | null;
    size: string | null;
    is_virtual: boolean;
    price: number | null;
    stock: number;
  }>;
  attributes: {
    material_primary: string | null;
    material_color: string | null;
    material_weight_grams: number | null;
    stone_main_type: string | null;
    stone_main_carats: number | null;
    stone_main_color: string | null;
    stone_main_clarity: string | null;
    stone_main_cut: string | null;
    stone_main_certificate: string | null;
    stones_secondary_type: string | null;
    stones_secondary_count: number | null;
    pearl_type: string | null;
    pearl_size_mm: number | null;
    pearl_color: string | null;
    size_ring_it: number | null;
    size_bracelet_cm: number | null;
    size_necklace_cm: number | null;
    size_earring_mm: number | null;
    ring_type: string | null;
    ring_style: string | null;
    earring_type: string | null;
    bracelet_type: string | null;
    necklace_type: string | null;
    pendant_type: string | null;
    gender: string | null;
    item_condition: string | null;
  };
  tags: Array<{
    code: string;
    label: string;
    color: string | null;
    icon: string | null;
  }>;
  seo_title: string | null;
  seo_description: string | null;
  description_it: string | null;
  description_en: string | null;
}

// Labels per attributi
const attributeLabels: Record<string, string> = {
  material_primary: 'Materiale',
  material_color: 'Colore Materiale',
  material_weight_grams: 'Peso',
  stone_main_type: 'Pietra Principale',
  stone_main_carats: 'Carati',
  stone_main_color: 'Colore Pietra',
  stone_main_clarity: 'Purezza',
  stone_main_cut: 'Taglio',
  stone_main_certificate: 'Certificato',
  stones_secondary_type: 'Pietre Secondarie',
  stones_secondary_count: 'N. Pietre Secondarie',
  pearl_type: 'Tipo Perla',
  pearl_size_mm: 'Dimensione Perla',
  pearl_color: 'Colore Perla',
  size_ring_it: 'Misura Anello',
  size_bracelet_cm: 'Lunghezza Bracciale',
  size_necklace_cm: 'Lunghezza Collana',
  size_earring_mm: 'Dimensione Orecchini',
  ring_type: 'Tipo Anello',
  ring_style: 'Stile Anello',
  earring_type: 'Tipo Orecchini',
  bracelet_type: 'Tipo Bracciale',
  necklace_type: 'Tipo Collana',
  pendant_type: 'Tipo Pendente',
  gender: 'Genere',
  item_condition: 'Condizione',
};

// Labels per valori
const valueLabels: Record<string, Record<string, string>> = {
  material_primary: {
    oro_750: 'Oro 750 (18K)',
    oro_585: 'Oro 585 (14K)',
    oro_375: 'Oro 375 (9K)',
    argento_925: 'Argento 925',
    platino: 'Platino',
  },
  material_color: {
    giallo: 'Giallo',
    bianco: 'Bianco',
    rosa: 'Rosa',
    bicolore: 'Bicolore',
    tricolore: 'Tricolore',
  },
  gender: {
    donna: 'Donna',
    uomo: 'Uomo',
    unisex: 'Unisex',
    bambino: 'Bambino',
  },
  item_condition: {
    nuovo: 'Nuovo',
    ottimo: 'Ottimo stato',
    buono: 'Buono stato',
  },
};

function formatAttributeValue(key: string, value: any): string {
  if (value === null || value === undefined) return '';
  
  // Usa label personalizzata se disponibile
  if (valueLabels[key] && valueLabels[key][value]) {
    return valueLabels[key][value];
  }
  
  // Formattazioni specifiche
  if (key === 'material_weight_grams') return `${value} g`;
  if (key === 'stone_main_carats') return `${value} ct`;
  if (key === 'pearl_size_mm' || key === 'size_earring_mm') return `${value} mm`;
  if (key === 'size_bracelet_cm' || key === 'size_necklace_cm') return `${value} cm`;
  
  // Capitalizza prima lettera
  if (typeof value === 'string') {
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
  }
  
  return String(value);
}

export default function ProductDetailClient({ code }: { code: string }) {
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await fetchProduct(code);

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

    if (code) {
      loadProduct();
    }
  }, [code]);

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

  // Variante attualmente selezionata
  const activeVariant = selectedVariant
    ? product.variants?.find(v => v.sku === selectedVariant)
    : null;

  // Prezzo attivo: variante selezionata > prezzo base prodotto
  const activePrice = activeVariant?.price ?? product.price;

  // Label adattiva per il selettore misure
  const sizeLabel = (() => {
    if (!product.variants || product.variants.length === 0) return '';
    const attrName = product.variants[0]?.attribute_name;
    if (attrName === 'Misura') return 'Seleziona misura';
    if (attrName === 'Lunghezza (cm)') return 'Seleziona lunghezza';
    return 'Seleziona taglia';
  })();

  // Verifica se ci sono varianti con prezzo diverso dal base
  const hasVariantPricing = product.variants?.some(v => v.price !== null && v.price !== product.price) ?? false;

  const handleAddToCart = () => {
    // Costruisci oggetto Product compatibile con useCart
    const cartProduct = {
      code: product.code,
      ean: product.ean || '',
      name: product.name,
      description: product.description || '',
      load_type: product.load_type as any,
      macro_category: product.main_category || '',
      supplier: product.supplier,
      price: product.price,
      images: product.images,
      stock: product.stock,
      variants: product.variants,
    };
    addToCart(cartProduct, selectedVariant ? product.variants?.find(v => v.sku === selectedVariant) : undefined);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  // Filtra attributi con valore
  const displayAttributes = Object.entries(product.attributes)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      label: attributeLabels[key] || key,
      value: formatAttributeValue(key, value),
    }));

  // Raggruppa attributi per categoria
  const materialAttributes = displayAttributes.filter(a => 
    a.key.startsWith('material_') || a.key === 'gender'
  );
  const stoneAttributes = displayAttributes.filter(a => 
    a.key.startsWith('stone_') || a.key.startsWith('pearl_')
  );
  const sizeAttributes = displayAttributes.filter(a => 
    a.key.startsWith('size_') || a.key.includes('_type') || a.key.includes('_style')
  );
  const otherAttributes = displayAttributes.filter(a => 
    a.key === 'item_condition'
  );

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
          {product.subcategory && (
            <>
              <span className="text-gray-300">/</span>
              <Link 
                href={`/prodotti?categoria=gioielli&sottocategoria=${product.subcategory}`}
                className="text-gray-500 hover:text-gray-700 capitalize"
              >
                {product.subcategory.replace(/_/g, ' ')}
              </Link>
            </>
          )}
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
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

              {/* Tags */}
              {product.tags.length > 0 && product.stock.available && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {product.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag.code}
                      className="text-white text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: tag.color || '#333' }}
                    >
                      {tag.icon} {tag.label}
                    </span>
                  ))}
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
            {/* Brand/Supplier */}
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              {product.brand || product.supplier || product.main_category}
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
            <div className="mt-6 flex items-baseline gap-3">
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(activePrice)}
              </p>
              {/* Show base price struck through if variant has different price */}
              {activeVariant && activeVariant.price !== null && activeVariant.price !== product.price && (
                <p className="text-xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </p>
              )}
              {/* Show compare_at_price if no variant override */}
              {!activeVariant && product.compare_at_price && product.compare_at_price > product.price && (
                <p className="text-xl text-gray-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </p>
              )}

            </div>

            {/* Description */}
            {(product.description || product.description_it) && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Descrizione</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description_it || product.description}
                </p>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{sizeLabel}</h3>
                  {hasVariantPricing && (
                    <span className="text-xs text-gray-500">
                      Il prezzo varia in base alla misura
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant === variant.sku;
                    const isDisabled = variant.stock === 0;
                    const showPrice = hasVariantPricing && variant.price !== null && variant.price !== product.price;

                    return (
                      <button
                        key={variant.sku}
                        onClick={() => setSelectedVariant(isSelected ? null : (variant.sku || null))}
                        disabled={isDisabled}
                        className={`relative px-4 py-2 border rounded-lg transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white ring-1 ring-black'
                            : isDisabled
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-400 text-gray-900'
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {variant.size || variant.name || variant.sku}
                        </span>
                        {showPrice && !isSelected && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {formatPrice(variant.price!)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.stock.available || (product.variants && product.variants.length > 0 && !selectedVariant)}
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {!product.stock.available
                  ? 'Non disponibile'
                  : product.variants && product.variants.length > 0 && !selectedVariant
                  ? 'Seleziona una misura'
                  : 'Aggiungi al carrello'
                }
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

        {/* Attributes Section */}
        {displayAttributes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Caratteristiche</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Materiale */}
              {materialAttributes.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Gem className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Materiale</h3>
                  </div>
                  <dl className="space-y-2">
                    {materialAttributes.map(attr => (
                      <div key={attr.key} className="flex justify-between">
                        <dt className="text-gray-500 text-sm">{attr.label}</dt>
                        <dd className="text-gray-900 text-sm font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Pietre */}
              {stoneAttributes.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Pietre</h3>
                  </div>
                  <dl className="space-y-2">
                    {stoneAttributes.map(attr => (
                      <div key={attr.key} className="flex justify-between">
                        <dt className="text-gray-500 text-sm">{attr.label}</dt>
                        <dd className="text-gray-900 text-sm font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Misure e Tipo */}
              {sizeAttributes.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Dettagli</h3>
                  </div>
                  <dl className="space-y-2">
                    {sizeAttributes.map(attr => (
                      <div key={attr.key} className="flex justify-between">
                        <dt className="text-gray-500 text-sm">{attr.label}</dt>
                        <dd className="text-gray-900 text-sm font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Altro */}
              {otherAttributes.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Informazioni</h3>
                  </div>
                  <dl className="space-y-2">
                    {otherAttributes.map(attr => (
                      <div key={attr.key} className="flex justify-between">
                        <dt className="text-gray-500 text-sm">{attr.label}</dt>
                        <dd className="text-gray-900 text-sm font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}