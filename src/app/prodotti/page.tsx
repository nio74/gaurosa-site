'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, X, Loader2 } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import { Product } from '@/types';

// Labels per le categorie
const categoryLabels: Record<string, string> = {
  gioielleria: 'Gioielli',
  orologi: 'Orologi',
  accessori: 'Accessori',
  oggettistica: 'Oggettistica',
  produzione_propria: 'Produzione Propria',
  carico_peso: 'Metalli Preziosi',
};

// Opzioni ordinamento
const sortOptions = [
  { value: 'newest', label: 'Novità' },
  { value: 'price_asc', label: 'Prezzo: dal più basso' },
  { value: 'price_desc', label: 'Prezzo: dal più alto' },
  { value: 'name_asc', label: 'Nome: A-Z' },
];

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stati
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Parametri URL
  const categoria = searchParams.get('categoria') || '';
  const sottocategoria = searchParams.get('sottocategoria') || '';
  const search = searchParams.get('search') || '';

  // Fetch prodotti dal database locale gaurosasite
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Costruisci URL con parametri
      const params = new URLSearchParams();
      if (categoria) params.set('categoria', categoria);
      if (sottocategoria) params.set('sottocategoria', sottocategoria);
      if (search) params.set('search', search);
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      params.set('sort', sortBy);

      const response = await fetch(`/api/products.php?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // Trasforma i prodotti nel formato atteso dal frontend
        const transformedProducts: Product[] = data.data.products.map((p: any) => ({
          code: p.code,
          ean: p.ean,
          name: p.name,
          description: p.description,
          load_type: p.load_type as Product['load_type'],
          macro_category: p.macro_category,
          supplier: p.supplier,
          price: p.price,
          images: p.images.map((img: any) => ({
            url: img.url,
            is_primary: img.is_primary,
            position: img.position,
          })),
          stock: p.stock,
          variants: p.variants,
        }));
        setProducts(transformedProducts);
        setTotalProducts(data.data.pagination.total);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
    } finally {
      setLoading(false);
    }
  }, [categoria, sottocategoria, search, currentPage, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Gestisci cambio filtri
  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory) {
      params.set('categoria', newCategory);
    } else {
      params.delete('categoria');
    }
    params.delete('sottocategoria');
    router.push(`/prodotti?${params.toString()}`);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    router.push('/prodotti');
    setCurrentPage(1);
  };

  // Titolo pagina
  const pageTitle = categoria
    ? categoryLabels[categoria] || categoria
    : 'Tutti i Prodotti';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <p className="mt-2 text-gray-600">
              {totalProducts} prodott{totalProducts === 1 ? 'o' : 'i'} disponibil{totalProducts === 1 ? 'e' : 'i'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtri - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Categorie</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    !categoria
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tutti
                </button>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => handleCategoryChange(value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      categoria === value
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {categoria && (
                <button
                  onClick={handleClearFilters}
                  className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Rimuovi filtri
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Filtri Mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filtri
                {categoria && (
                  <span className="ml-1 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                    1
                  </span>
                )}
              </button>

              {/* Ordinamento */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">Ordina per:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filtri Mobile Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white rounded-xl p-4 mb-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900 mb-3">Categorie</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      handleCategoryChange('');
                      setShowFilters(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      !categoria
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Tutti
                  </button>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        handleCategoryChange(value);
                        setShowFilters(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        categoria === value
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.code}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Precedente
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Pagina {currentPage} di {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Successiva
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  Nessun prodotto trovato
                </p>
                {categoria && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="mt-4"
                  >
                    Mostra tutti i prodotti
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper con Suspense per useSearchParams
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
