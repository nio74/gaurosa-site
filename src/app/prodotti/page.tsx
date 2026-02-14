'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2, SlidersHorizontal, Search, X, Grid2x2, Grid3x3 } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters, { FiltersDrawer } from '@/components/products/ProductFilters';
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
  { value: 'newest', label: 'Novità' },
  { value: 'price_asc', label: 'Prezzo: dal più basso' },
  { value: 'price_desc', label: 'Prezzo: dal più alto' },
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sidebar filters (material, color, stone, gender, tag, price)
  const [sidebarFilters, setSidebarFilters] = useState<ActiveFilters>({});

  // Available filter options from API
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000, avg: 500 });

  // URL-driven params (from header nav / search)
  const sottocategoria = searchParams.get('sottocategoria') || '';
  const categoria = searchParams.get('categoria') || '';
  const collezione = searchParams.get('collezione') || '';
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
      setFetchTrigger(t => t + 1);
    }
  }, [searchParamsString]);

  // ============================================
  // FETCH PRODUCTS
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

      setLoading(true);

      try {
        const data = await fetchProducts({
          categoria: categoria || undefined,
          sottocategoria: sottocategoria || undefined,
          collezione: collezione || undefined,
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
  }, [fetchTrigger, sottocategoria, categoria, collezione, search]);

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
    const { sottocategoria: _sub, ...sidebarOnly } = newFilters;
    setSidebarFilters(sidebarOnly);
    setCurrentPage(1);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRemoveFilter = useCallback((filterCode: string, value: string) => {
    if (filterCode === 'price') {
      handleFilterChange({ ...sidebarFilters, price_min: undefined, price_max: undefined });
      return;
    }
    const currentValues = (sidebarFilters as any)[filterCode] as string[] | undefined;
    if (currentValues) {
      const newValues = currentValues.filter((v: string) => v !== value);
      handleFilterChange({ ...sidebarFilters, [filterCode]: newValues.length > 0 ? newValues : undefined });
    }
  }, [sidebarFilters, handleFilterChange]);

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
    : collezione
      ? `Collezione ${collezione.charAt(0).toUpperCase() + collezione.slice(1)}`
      : sottocategoria
        ? subcategoryLabels[sottocategoria] || sottocategoria
        : 'Tutti i Prodotti';

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
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <p className="mt-2 text-gray-500">
              {totalProducts} prodott{totalProducts === 1 ? 'o' : 'i'} disponibil{totalProducts === 1 ? 'e' : 'i'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* ============================================ */}
        {/* TOOLBAR: Filtri + Chips + Ordinamento */}
        {/* ============================================ */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Filter button */}
          <button
            onClick={() => setFiltersOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm font-medium ${
              activeFilterCount > 0
                ? 'bg-brand-rose text-white border-brand-rose hover:bg-brand-rose-dark'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-pink-border hover:bg-brand-pink-light'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtri</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-white/20 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search chip */}
          {search && (
            <button
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>&ldquo;{search}&rdquo;</span>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {/* Active filter chips */}
          <ActiveFilterChips
            activeFilters={sidebarFilters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {/* ============================================ */}
        {/* PRODUCT GRID — Full width */}
        {/* ============================================ */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-rose/50" />
              <p className="text-sm text-gray-400">Caricamento prodotti...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ProductCard
                    product={product}
                    index={index}
                  />
                </motion.div>
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
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-brand-rose text-white'
                            : 'text-gray-600 hover:bg-brand-pink-light'
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
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-4 bg-brand-pink-light rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-brand-rose/50" />
            </div>
            <p className="text-gray-700 text-lg font-medium mb-2">
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

      {/* Filters Drawer (slide from right, both desktop & mobile) */}
      <FiltersDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={availableFilters}
        priceRange={priceRange}
        activeFilters={sidebarFilters}
        onFilterChange={handleFilterChange}
        totalFiltered={totalProducts}
        loading={filtersLoading}
      />
    </div>
  );
}

// ============================================
// ACTIVE FILTER CHIPS (inline in toolbar)
// ============================================

import { translateFilterValue, formatPrice } from '@/lib/labels';

function ActiveFilterChips({
  activeFilters,
  onRemove,
  onClearAll,
}: {
  activeFilters: ActiveFilters;
  onRemove: (filterCode: string, value: string) => void;
  onClearAll: () => void;
}) {
  const chips: { filterCode: string; value: string; label: string }[] = [];

  const arrayFilters: (keyof ActiveFilters)[] = [
    'material', 'material_color', 'gender', 'stone_type', 'tag',
  ];

  for (const key of arrayFilters) {
    const values = activeFilters[key] as string[] | undefined;
    if (values?.length) {
      for (const value of values) {
        chips.push({ filterCode: key, value, label: translateFilterValue(key, value) });
      }
    }
  }

  if (activeFilters.price_min !== undefined || activeFilters.price_max !== undefined) {
    const minLabel = activeFilters.price_min ? formatPrice(activeFilters.price_min) : '';
    const maxLabel = activeFilters.price_max ? formatPrice(activeFilters.price_max) : '';
    chips.push({ filterCode: 'price', value: 'range', label: `${minLabel} — ${maxLabel}`.trim() });
  }

  if (chips.length === 0) return null;

  return (
    <>
      {chips.map((chip, i) => (
        <motion.button
          key={`${chip.filterCode}-${chip.value}-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => onRemove(chip.filterCode, chip.value)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-pink-light text-brand-text text-sm rounded-full border border-brand-pink-border/30 hover:bg-brand-pink transition-colors"
        >
          <span>{chip.label}</span>
          <X className="w-3.5 h-3.5 text-brand-rose/60" />
        </motion.button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-brand-rose hover:text-brand-rose-dark font-medium px-2 py-2 transition-colors"
        >
          Rimuovi tutti
        </button>
      )}
    </>
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
          <Loader2 className="w-8 h-8 animate-spin text-brand-rose/50" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
