'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, ArrowRight, ChevronDown } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { fetchCollections } from '@/lib/api';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  product_count: number;
}

// Sottocategorie principali dei Gioielli (ordine alfabetico)
const navigation = [
  { name: 'Anelli', href: '/prodotti?sottocategoria=anello' },
  { name: 'Bracciali', href: '/prodotti?sottocategoria=bracciale' },
  { name: 'Collane', href: '/prodotti?sottocategoria=collana' },
  { name: 'Orecchini', href: '/prodotti?sottocategoria=orecchini' },
];

// Quick search suggestions
const searchSuggestions = [
  { label: 'Bracciali in oro', query: 'bracciale oro' },
  { label: 'Anelli con diamante', query: 'anello diamante' },
  { label: 'Collane argento', query: 'collana argento' },
  { label: 'Orecchini perle', query: 'orecchini perle' },
];

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const collectionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { itemCount } = useCart();

  // Active sottocategoria from URL for highlighting nav links
  const activeSottocategoria = searchParams.get('sottocategoria') || '';
  const activeCollezione = searchParams.get('collezione') || '';

  // Fetch collections on mount
  useEffect(() => {
    async function loadCollections() {
      try {
        const res = await fetchCollections();
        if (res.success && res.data) {
          setCollections(res.data);
        }
      } catch (error) {
        console.error('Error loading collections:', error);
      }
    }
    loadCollections();
  }, []);

  // Close collections dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCollectionsEnter = useCallback(() => {
    if (collectionsTimeoutRef.current) clearTimeout(collectionsTimeoutRef.current);
    setCollectionsOpen(true);
  }, []);

  const handleCollectionsLeave = useCallback(() => {
    collectionsTimeoutRef.current = setTimeout(() => setCollectionsOpen(false), 200);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      // Small delay to let animation start
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    router.push(`/prodotti?search=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  }, [router]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-pink/90 backdrop-blur-md border-b border-brand-pink-border/30">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Image
                  src="/images/logo-gaurosa.png"
                  alt="Gaurosa Gioielli"
                  width={162}
                  height={80}
                  priority
                  className="h-10 lg:h-12 w-auto"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {navigation.map((item) => {
                // Check if this nav item matches the current sottocategoria
                const itemSubcat = new URL(item.href, 'http://x').searchParams.get('sottocategoria');
                const isActive = itemSubcat === activeSottocategoria;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors relative group ${
                      isActive
                        ? 'text-brand-rose'
                        : 'text-brand-text/80 hover:text-brand-rose'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-rose transition-all ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                  </Link>
                );
              })}

              {/* Collections Dropdown */}
              {collections.length > 0 && (
                <div
                  ref={collectionsRef}
                  className="relative"
                  onMouseEnter={handleCollectionsEnter}
                  onMouseLeave={handleCollectionsLeave}
                >
                  <button
                    onClick={() => setCollectionsOpen(!collectionsOpen)}
                    className={`text-sm font-medium transition-colors relative group flex items-center gap-1 ${
                      activeCollezione
                        ? 'text-brand-rose'
                        : 'text-brand-text/80 hover:text-brand-rose'
                    }`}
                  >
                    Collezioni
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collectionsOpen ? 'rotate-180' : ''}`} />
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-rose transition-all ${
                      activeCollezione ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                  </button>

                  <AnimatePresence>
                    {collectionsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="py-2">
                          {collections.map((collection) => (
                            <Link
                              key={collection.id}
                              href={`/prodotti?collezione=${collection.slug}`}
                              onClick={() => setCollectionsOpen(false)}
                              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                activeCollezione === collection.slug
                                  ? 'bg-brand-pink-light text-brand-rose font-medium'
                                  : 'text-brand-text/80 hover:bg-brand-pink-light/50 hover:text-brand-rose'
                              }`}
                            >
                              <span>{collection.name}</span>
                              {collection.product_count > 0 && (
                                <span className="text-xs text-brand-text/40 bg-brand-pink/50 px-1.5 py-0.5 rounded-full">
                                  {collection.product_count}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-brand-text/80 hover:text-brand-rose transition-colors group relative"
                aria-label="Cerca prodotti"
              >
                <Search className="w-5 h-5" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-brand-text/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Ctrl+K
                </span>
              </button>
              <Link
                href="/account"
                className="p-2 text-brand-text/80 hover:text-brand-rose transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                href="/carrello"
                className="p-2 text-brand-text/80 hover:text-brand-rose transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-rose text-white text-xs font-semibold rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-brand-text/80 hover:text-brand-rose transition-colors"
                aria-label="Cerca prodotti"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link href="/carrello" className="relative p-2 text-brand-text/80">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-rose text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-brand-text/80"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-brand-pink/95 backdrop-blur-md border-t border-brand-pink-border/30"
            >
              <div className="container mx-auto px-4 py-6 space-y-4">
                {navigation.map((item) => {
                  const itemSubcat = new URL(item.href, 'http://x').searchParams.get('sottocategoria');
                  const isActive = itemSubcat === activeSottocategoria;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block text-lg font-medium ${
                        isActive
                          ? 'text-brand-rose border-l-2 border-brand-rose pl-3'
                          : 'text-brand-text/80 hover:text-brand-rose'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                {/* Collections in mobile menu */}
                {collections.length > 0 && (
                  <div className="pt-4 border-t border-brand-pink-border/30">
                    <p className="text-xs font-semibold text-brand-text/50 uppercase tracking-wider mb-3">
                      Collezioni
                    </p>
                    <div className="space-y-3 pl-1">
                      {collections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/prodotti?collezione=${collection.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block text-base font-medium ${
                            activeCollezione === collection.slug
                              ? 'text-brand-rose border-l-2 border-brand-rose pl-3'
                              : 'text-brand-text/80 hover:text-brand-rose'
                          }`}
                        >
                          {collection.name}
                          {collection.product_count > 0 && (
                            <span className="ml-2 text-xs text-brand-text/40">
                              ({collection.product_count})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-brand-pink-border/30">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-brand-text/80 hover:text-brand-rose"
                  >
                    <User className="w-5 h-5" />
                    <span>Il mio account</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================ */}
      {/* SEARCH OVERLAY */}
      {/* ============================================ */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="fixed inset-0 bg-brand-rose/30 backdrop-blur-sm z-[60]"
            />

            {/* Search panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 left-0 right-0 z-[70] bg-white shadow-2xl"
            >
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Search form */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca gioielli, orologi, accessori..."
                    className="w-full pl-12 pr-24 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent placeholder:text-gray-400"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {searchQuery.trim() && (
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-rose text-white text-sm font-medium rounded-lg hover:bg-brand-rose-dark transition-colors"
                      >
                        Cerca
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>

                {/* Quick suggestions */}
                {!searchQuery.trim() && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                      Ricerche suggerite
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.query}
                          onClick={() => handleSearch(suggestion.query)}
                          className="px-3 py-1.5 bg-brand-pink-light text-brand-text text-sm rounded-full hover:bg-brand-pink transition-colors"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard hint */}
                <div className="mt-3 flex items-center justify-end gap-4 text-xs text-gray-400">
                  <span className="hidden sm:inline">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Esc</kbd>
                    {' '}per chiudere
                  </span>
                  <span className="hidden sm:inline">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Enter</kbd>
                    {' '}per cercare
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Wrap in Suspense to support useSearchParams during static generation
export default function Header() {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-pink/90 backdrop-blur-md border-b border-brand-pink-border/30">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Image src="/images/logo-gaurosa.png" alt="Gaurosa Gioielli" width={162} height={80} className="h-10 lg:h-12 w-auto" />
          </div>
        </nav>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
