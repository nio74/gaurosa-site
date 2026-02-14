'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { Filter, FilterValue, PriceRange, ActiveFilters } from '@/types';
import { translateFilterValue, getColorSwatch, formatPrice } from '@/lib/labels';

// ============================================
// TYPES
// ============================================

interface ProductFiltersProps {
  filters: Filter[];
  priceRange: PriceRange;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  totalFiltered: number;
  className?: string;
}

// ============================================
// FILTER SECTION (collapsible)
// ============================================

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left py-1 group"
      >
        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// CHECKBOX FILTER
// ============================================

function CheckboxFilter({
  filterCode,
  values,
  selected,
  onChange,
}: {
  filterCode: string;
  values: FilterValue[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  if (values.length === 0) return null;

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
      {values.map((item) => {
        const label = item.label || translateFilterValue(filterCode, item.value);
        const isSelected = selected.includes(item.value);

        return (
          <div
            key={item.value}
            onClick={() => toggleValue(item.value)}
            className="flex items-center gap-2.5 cursor-pointer group py-0.5"
            role="checkbox"
            aria-checked={isSelected}
          >
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-brand-rose border-brand-rose'
                  : 'border-gray-300 group-hover:border-brand-pink-border'
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span
              className={`text-sm flex-1 select-none ${
                isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}
            >
              {label}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// COLOR SWATCH FILTER
// ============================================

function ColorFilter({
  values,
  selected,
  onChange,
}: {
  values: FilterValue[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => {
        const swatch = getColorSwatch(item.value);
        const isSelected = selected.includes(item.value);
        const label = translateFilterValue('material_color', item.value);

        return (
          <button
            key={item.value}
            onClick={() => toggleValue(item.value)}
            title={`${label} (${item.count})`}
            className={`relative w-8 h-8 rounded-full transition-all ${
              isSelected
                ? 'ring-2 ring-brand-rose ring-offset-2'
                : 'ring-1 ring-gray-200 hover:ring-brand-pink-border'
            }`}
          >
            <span
              className="absolute inset-0.5 rounded-full"
              style={{
                background: swatch || '#ccc',
                border: item.value === 'bianco' ? '1px solid #e5e7eb' : undefined,
              }}
            />
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-brand-rose drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// TAG FILTER
// ============================================

function TagFilter({
  values,
  selected,
  onChange,
}: {
  values: FilterValue[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => {
        const isSelected = selected.includes(item.value);
        return (
          <button
            key={item.value}
            onClick={() => toggleValue(item.value)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? 'ring-2 ring-brand-rose ring-offset-1'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: item.color ? `${item.color}20` : '#f3f4f6',
              color: item.color || '#374151',
              border: `1px solid ${item.color || '#d1d5db'}`,
            }}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label || item.value}</span>
            <span className="opacity-60">({item.count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// PRICE RANGE SLIDER
// ============================================

function PriceRangeSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
}: {
  min: number;
  max: number;
  currentMin?: number;
  currentMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const sliderMin = Math.floor(min / 10) * 10;
  const sliderMax = Math.ceil(max / 10) * 10;
  
  const [localMin, setLocalMin] = useState(currentMin ?? sliderMin);
  const [localMax, setLocalMax] = useState(currentMax ?? sliderMax);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalMin(currentMin ?? sliderMin);
    setLocalMax(currentMax ?? sliderMax);
  }, [currentMin, currentMax, sliderMin, sliderMax]);

  const handleChange = useCallback(
    (newMin: number, newMax: number) => {
      setLocalMin(newMin);
      setLocalMax(newMax);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const effectiveMin = newMin <= sliderMin ? undefined : newMin;
        const effectiveMax = newMax >= sliderMax ? undefined : newMax;
        onChange(effectiveMin, effectiveMax);
      }, 400);
    },
    [onChange, sliderMin, sliderMax]
  );

  if (sliderMax <= sliderMin) return null;

  const minPercent = ((localMin - sliderMin) / (sliderMax - sliderMin)) * 100;
  const maxPercent = ((localMax - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">{formatPrice(localMin)}</span>
        <span className="text-gray-400">—</span>
        <span className="font-medium text-gray-900">{formatPrice(localMax)}</span>
      </div>

      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
        
        <div
          className="absolute h-1 bg-brand-rose rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={10}
          value={localMin}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), localMax - 10);
            handleChange(val, localMax);
          }}
          className="absolute w-full h-6 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-brand-rose
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:hover:shadow-md
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-brand-rose
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:pointer-events-auto
          "
          style={{ zIndex: localMin > sliderMax - 100 ? 5 : 3 }}
        />

        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={10}
          value={localMax}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), localMin + 10);
            handleChange(localMin, val);
          }}
          className="absolute w-full h-6 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-brand-rose
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:hover:shadow-md
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-brand-rose
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:pointer-events-auto
          "
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN FILTERS COMPONENT (used inside drawer)
// ============================================

export default function ProductFilters({
  filters,
  priceRange,
  activeFilters,
  onFilterChange,
  totalFiltered,
  className = '',
}: ProductFiltersProps) {
  const activeCount = Object.entries(activeFilters).reduce((count, [key, value]) => {
    if (Array.isArray(value)) return count + value.length;
    if (value !== undefined && value !== null) return count + 1;
    return count;
  }, 0);

  const handleArrayFilterChange = useCallback(
    (filterCode: string, values: string[]) => {
      onFilterChange({
        ...activeFilters,
        [filterCode]: values.length > 0 ? values : undefined,
      });
    },
    [activeFilters, onFilterChange]
  );

  const handlePriceChange = useCallback(
    (min: number | undefined, max: number | undefined) => {
      onFilterChange({
        ...activeFilters,
        price_min: min,
        price_max: max,
      });
    },
    [activeFilters, onFilterChange]
  );

  const handleClearAll = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-rose" />
          <h3 className="font-semibold text-gray-900">Filtri</h3>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-rose text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-brand-rose hover:text-brand-rose-dark font-medium transition-colors"
          >
            Rimuovi tutto
          </button>
        )}
      </div>

      {/* Filter sections */}
      {filters.map((filter) => {
        if (filter.values.length === 0) return null;

        const selectedValues = (activeFilters as any)[filter.code] as string[] | undefined;

        return (
          <FilterSection
            key={filter.code}
            title={filter.label}
            defaultOpen={filter.values.length <= 8}
          >
            {filter.type === 'color' ? (
              <ColorFilter
                values={filter.values}
                selected={selectedValues || []}
                onChange={(values) => handleArrayFilterChange(filter.code, values)}
              />
            ) : filter.type === 'tag' ? (
              <TagFilter
                values={filter.values}
                selected={selectedValues || []}
                onChange={(values) => handleArrayFilterChange(filter.code, values)}
              />
            ) : (
              <CheckboxFilter
                filterCode={filter.code}
                values={filter.values}
                selected={selectedValues || []}
                onChange={(values) => handleArrayFilterChange(filter.code, values)}
              />
            )}
          </FilterSection>
        );
      })}

      {/* Price range */}
      {priceRange.max > priceRange.min && (
        <FilterSection title="Prezzo" defaultOpen={true}>
          <PriceRangeSlider
            min={priceRange.min}
            max={priceRange.max}
            currentMin={activeFilters.price_min}
            currentMax={activeFilters.price_max}
            onChange={handlePriceChange}
          />
        </FilterSection>
      )}

      {/* Results count */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
          <span className="font-semibold text-gray-900">{totalFiltered}</span>{' '}
          prodott{totalFiltered === 1 ? 'o' : 'i'} trovati
        </p>
      </div>
    </div>
  );
}

// ============================================
// FILTERS DRAWER (slide from right — desktop & mobile)
// ============================================

export function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  priceRange,
  activeFilters,
  onFilterChange,
  totalFiltered,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: Filter[];
  priceRange: PriceRange;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  totalFiltered: number;
  loading?: boolean;
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer — slides from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-rose" />
                <h2 className="text-lg font-bold text-gray-900">Filtri</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading && filters.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-rose/50" />
                </div>
              ) : (
                <ProductFilters
                  filters={filters}
                  priceRange={priceRange}
                  activeFilters={activeFilters}
                  onFilterChange={onFilterChange}
                  totalFiltered={totalFiltered}
                />
              )}
            </div>

            {/* Footer — show results button */}
            <div className="px-6 py-4 border-t bg-white">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-brand-rose text-white font-medium rounded-full hover:bg-brand-rose-dark transition-colors text-sm"
              >
                Mostra {totalFiltered} prodott{totalFiltered === 1 ? 'o' : 'i'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Keep backward compatibility export
export { FiltersDrawer as MobileFiltersDrawer };
