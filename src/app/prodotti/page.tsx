'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter as FilterIcon, ChevronDown, Loader2, SlidersHorizontal, Search, X } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters, { MobileFiltersDrawer } from '@/components/products/ProductFilters';
import Button from '@/components/ui/Button';
import { Product, ActiveFilters, Filter, PriceRange } from '@/types';
import { fetchProducts, fetchFilters, transformProduct } from '@/lib/api';

// Labels per le sottocategorie
const subcategoryLabels: Record<string, string> = {
  anello: 'Anelli',
  bracciale: 'Bracciali',
  collana: 'Collane',
  orecchini: 'Orecchini',
  pendente: 'Pendenti',
  ciondolo: 'Ciondoli',
  gemelli: 'Gemelli',
  spilla: 'Spille',
};

// Opzioni ordinamento
const sortOptions = [
  { value: 'newest', label: 'Novita' },
  { value: 'price_asc', label: 'Prezzo: dal piu basso' },
  { value: 'price_desc', label: 'Prezzo: dal piu alto' },
  { value: 'name_asc', label: 'Nome: A-Z' },
];

// ============================================
// MAIN PAGE CONTENT
// ============================================

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ============================================
  // STATE
  // ============================================
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sidebar filters (material, color, stone, gender, tag, price)
  const [sidebarFilters, setSidebarFilters] = useState<ActiveFilters>({});

  // Available filter options from API
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000, avg: 500 });

  // URL-driven params (from header nav / search)
  const sottocategoria = searchParams.get('sottocategoria') || '';
  const categoria = searchParams.get('categoria') || '';
  const search = searchParams.get('search') || '';

  // Track URL changes to reset sidebar filters
  const searchParamsString = searchParams.toString();
  const prevUrlRef = useRef(searchParamsString);

  // A counter that increments every time we want to re-fetch
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // ============================================
  // RESET sidebar filters when URL changes (header nav / search)
  // ============================================
  useEffect(() => {
    if (searchParamsString !== prevUrlRef.current) {
      prevUrlRef.current = searchParamsString;
      setSidebarFilters({});
      setCurrentPage(1);
      setSortBy(searchParams.get('sort') || 'newest');
      // Trigger a new fetch
      setFetchTrigger(t => t + 1);
    }
  }, [searchParamsString]);

  // ============================================
  // FETCH PRODUCTS - triggered by fetchTrigger
  // Uses refs to always read latest state
  // ============================================
  const sidebarFiltersRef = useRef(sidebarFilters);
  sidebarFiltersRef.current = sidebarFilters;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;

  useEffect(() => {
    let cancelled = false;

    async function doFetch() {
      const filters = sidebarFiltersRef.current;
      const page = currentPageRef.current;
      const sort = sortByRef.current;

      console.log('📦 Fetching products:', { sottocategoria, search, filters, page, sort });
      setLoading(true);

      try {
        const data = await fetchProducts({
          categoria: categoria || undefined,
          sottocategoria: sottocategoria || undefined,
          search: search || undefined,
          page,
          limit: 12,
          sort,
          material: filters.material?.join(',') || undefined,
          material_color: filters.material_color?.join(',') || undefined,
          stone_type: filters.stone_type?.join(',') || undefined,
          gender: filters.gender?.join(',') || undefined,
          price_min: filters.price_min,
          price_max: filters.price_max,
          tag: filters.tag?.join(',') || undefined,
        });

        if (!cancelled && data.success) {
          const transformedProducts: Product[] = data.data.products.map((p: any) =>
            transformProduct(p) as Product
          );
          setProducts(transformedProducts);
          setTotalProducts(data.data.pagination.total);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Errore caricamento prodotti:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doFetch();
    return () => { cancelled = true; };
  }, [fetchTrigger, sottocategoria, categoria, search]);

  // ============================================
  // FETCH FILTERS
  // ============================================
  useEffect(() => {
    let cancelled = false;

    async function doFetchFilters() {
      try {
        setFiltersLoading(true);
        const contextFilters: ActiveFilters = { ...sidebarFiltersRef.current };
        if (sottocategoria) {
          contextFilters.sottocategoria = [sottocategoria];
        }

        const data = await fetchFilters(contextFilters);

        if (!cancelled && data.success && data.data) {
          setAvailableFilters(data.data.filters || []);
          setPriceRange(data.data.price_range || { min: 0, max: 10000, avg: 500 });
        }
      } catch (error) {
        console.error('Error loading filters:', error);
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    }

    const timer = setTimeout(doFetchFilters, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchTrigger, sottocategoria]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFilterChange = useCallback((newFilters: ActiveFilters) => {
    // Strip sottocategoria (URL-driven, not sidebar)
    const { sottocategoria: _sub, ...sidebarOnly } = newFilters;
    console.log('🔧 Filter changed:', JSON.stringify(sidebarOnly));
    setSidebarFilters(sidebarOnly);
    setCurrentPage(1);
    // Trigger re-fetch
    setFetchTrigger(t => t + 1);
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    setFetchTrigger(t => t + 1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSidebarFilters({});
    setCurrentPage(1);
    setFetchTrigger(t => t + 1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setFetchTrigger(t => t + 1);
  }, []);

  // Count active sidebar filters for badge
  const activeFilterCount = Object.entries(sidebarFilters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length;
    if (value !== undefined && value !== null) return count + 1;
    return count;
  }, 0);

  // ============================================
  // PAGE TITLE
  // ============================================
  const pageTitle = search
    ? `Risultati per "${search}"`
    : sottocategoria
      ? subcategoryLabels[sottocategoria] || sottocategoria
      : 'Tutti i Prodotti';

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    const newQuery = params.toString();
    router.push(`/prodotti${newQuery ? '?' + newQuery : ''}`, { scroll: false });
  }, [searchParams, router]);

  // ============================================
  // RENDER
  // ============================================
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
            <div className="mt-2 flex items-center gap-3">
              <p className="text-gray-600">
                {totalProducts} prodott{totalProducts === 1 ? 'o' : 'i'} disponibil{totalProducts === 1 ? 'e' : 'i'}
              </p>
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{search}</span>
                  <X className="w-3.5 h-3.5 ml-0.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ============================================ */}
          {/* SIDEBAR FILTRI - Desktop */}
          {/* ============================================ */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl p-5 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              {filtersLoading && availableFilters.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <ProductFilters
                  filters={availableFilters}
                  priceRange={priceRange}
                  activeFilters={sidebarFilters}
                  onFilterChange={handleFilterChange}
                  totalFiltered={totalProducts}
                />
              )}
            </div>
          </aside>

          {/* ============================================ */}
          {/* MAIN CONTENT */}
          {/* ============================================ */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filtri</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 hidden sm:inline">Ordina per:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
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
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Precedente
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Successiva
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FilterIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">
                  Nessun prodotto trovato
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Prova a modificare i filtri o la ricerca
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                  >
                    Rimuovi tutti i filtri
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={availableFilters}
        priceRange={priceRange}
        activeFilters={sidebarFilters}
        onFilterChange={handleFilterChange}
        totalFiltered={totalProducts}
      />
    </div>
  );
}

// ============================================
// WRAPPER with Suspense
// ============================================
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
