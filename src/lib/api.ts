/**
 * API Client per gaurosa.it
 * 
 * Tutte le chiamate vanno alle API PHP.
 * - Sviluppo locale: XAMPP su http://localhost/gaurosa-site/api/
 * - Produzione: https://gaurosa.it/api/
 */

import type { ActiveFilters } from '@/types';

/**
 * Base URL delle API PHP
 *
 * Strategia:
 * - In locale (next dev): path VUOTO → i rewrite in next.config.ts
 *   proxy /api-*.php e /api/* verso XAMPP (http://localhost/gaurosa-site/...)
 * - In produzione (gaurosa.it): path VUOTO → stesso server Apache serve i PHP
 * - SSR in locale: usa http://localhost/gaurosa-site direttamente (no rewrite lato server)
 * - SSR in produzione: usa https://gaurosa.it
 */
function getApiBaseUrl(): string {
  // ── Lato CLIENT (browser) ──────────────────────────────────────────────────
  // Sia in locale che in produzione usiamo path relativo:
  // - In locale: Next.js dev server intercetta /api-*.php e fa proxy verso XAMPP
  // - In produzione: Apache serve direttamente i file PHP
  if (typeof window !== 'undefined') {
    return '';
  }

  // ── Lato SERVER (SSR / next dev) ───────────────────────────────────────────
  // I rewrite non funzionano lato server, quindi usiamo URL assoluto
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (siteUrl.includes('gaurosa.it')) {
    return 'https://gaurosa.it';
  }
  // Locale SSR: XAMPP diretto
  return 'http://localhost/gaurosa-site';
}

/**
 * Fetch wrapper con error handling
 */
async function apiFetch(endpoint: string, options?: RequestInit) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, error: 'Errore di connessione' };
  }
}

// ============================================
// PRODOTTI
// ============================================

/**
 * Fetch lista prodotti con filtri avanzati
 */
export async function fetchProducts(params?: {
  categoria?: string;
  sottocategoria?: string;
  collezione?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  // Filtri avanzati
  material?: string;
  material_color?: string;
  stone_type?: string;
  gender?: string;
  price_min?: number;
  price_max?: number;
  tag?: string;
}) {
  const queryParams = new URLSearchParams();
  
  if (params?.categoria) queryParams.set('categoria', params.categoria);
  if (params?.sottocategoria) queryParams.set('sottocategoria', params.sottocategoria);
  if (params?.collezione) queryParams.set('collezione', params.collezione);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.sort) queryParams.set('sort', params.sort);
  
  // Filtri avanzati
  if (params?.material) queryParams.set('material', params.material);
  if (params?.material_color) queryParams.set('material_color', params.material_color);
  if (params?.stone_type) queryParams.set('stone_type', params.stone_type);
  if (params?.gender) queryParams.set('gender', params.gender);
  if (params?.price_min !== undefined && params?.price_min !== null) {
    queryParams.set('price_min', params.price_min.toString());
  }
  if (params?.price_max !== undefined && params?.price_max !== null) {
    queryParams.set('price_max', params.price_max.toString());
  }
  if (params?.tag) queryParams.set('tag', params.tag);
  
  const query = queryParams.toString();
  return apiFetch(`api-products.php${query ? '?' + query : ''}`);
}

/**
 * Fetch singolo prodotto per codice
 */
export async function fetchProduct(code: string) {
  return apiFetch(`api-product.php?code=${encodeURIComponent(code)}`);
}

// ============================================
// FILTRI
// ============================================

/**
 * Fetch filtri disponibili con conteggi contestuali
 * Passa i filtri attivi per ottenere conteggi aggiornati
 */
export async function fetchFilters(activeFilters?: ActiveFilters) {
  const queryParams = new URLSearchParams();
  
  if (activeFilters?.sottocategoria?.length) {
    queryParams.set('sottocategoria', activeFilters.sottocategoria.join(','));
  }
  if (activeFilters?.material?.length) {
    queryParams.set('material', activeFilters.material.join(','));
  }
  if (activeFilters?.material_color?.length) {
    queryParams.set('material_color', activeFilters.material_color.join(','));
  }
  if (activeFilters?.stone_type?.length) {
    queryParams.set('stone_type', activeFilters.stone_type.join(','));
  }
  if (activeFilters?.gender?.length) {
    queryParams.set('gender', activeFilters.gender.join(','));
  }
  if (activeFilters?.tag?.length) {
    queryParams.set('tag', activeFilters.tag.join(','));
  }
  if (activeFilters?.price_min !== undefined && activeFilters?.price_min !== null) {
    queryParams.set('price_min', activeFilters.price_min.toString());
  }
  if (activeFilters?.price_max !== undefined && activeFilters?.price_max !== null) {
    queryParams.set('price_max', activeFilters.price_max.toString());
  }
  
  const query = queryParams.toString();
  return apiFetch(`api-filters.php${query ? '?' + query : ''}`);
}

// ============================================
// COLLEZIONI
// ============================================

/**
 * Fetch collezioni attive con conteggio prodotti
 */
export async function fetchCollections() {
  return apiFetch('api-collections.php');
}

// ============================================
// TRASFORMAZIONI DATI
// ============================================

/**
 * Trasforma prodotto da API a formato frontend
 */
export function transformProduct(p: any) {
  return {
    code: p.code,
    ean: p.ean || '',
    name: p.name,
    description: p.description || '',
    load_type: p.load_type || p.main_category || 'gioielleria',
    macro_category: p.main_category || 'gioielli',
    subcategory: p.subcategory || '',
    supplier: p.supplier || '',
    brand: p.brand || '',
    price: Number(p.price) || 0,
    compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    images: (p.images || []).map((img: any) => ({
      url: img.url,
      is_primary: Boolean(img.is_primary),
      position: Number(img.position) || 0,
    })),
    stock: {
      total: p.stock?.total ?? p.stock ?? 0,
      available: p.stock?.available ?? p.inStock ?? (Number(p.stock) > 0),
    },
    variants: p.variants || [],
    tags: p.tags || [],
    attributes: p.attributes || {},
  };
}

// ============================================
// AUTENTICAZIONE
// ============================================

export async function login(email: string, password: string) {
  return apiFetch('auth/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiFetch('auth/register.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout() {
  return apiFetch('auth/logout.php', { method: 'POST' });
}

export async function getMe() {
  return apiFetch('auth/me.php');
}

// ============================================
// CARRELLO
// ============================================

export async function getCart() {
  return apiFetch('cart.php');
}

export async function addToCart(productCode: string, quantity: number = 1, variantSku?: string) {
  return apiFetch('cart.php', {
    method: 'POST',
    body: JSON.stringify({ productCode, quantity, variantSku }),
  });
}

export async function updateCartItem(itemId: number, quantity: number) {
  return apiFetch('cart.php', {
    method: 'PUT',
    body: JSON.stringify({ itemId, quantity }),
  });
}

export async function removeFromCart(itemId: number) {
  return apiFetch(`cart.php?itemId=${itemId}`, { method: 'DELETE' });
}
