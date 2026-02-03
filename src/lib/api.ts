/**
 * API Client per gaurosa.it
 * 
 * Tutte le chiamate vanno alle API PHP.
 * - Sviluppo locale: XAMPP su http://localhost/gaurosa-site/api/
 * - Produzione: https://gaurosa.it/api/
 */

/**
 * Base URL delle API PHP
 * - In locale (Next.js dev): chiama XAMPP
 * - In produzione: path relativo (stesso dominio)
 */
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - usa produzione
    return 'https://gaurosa.it/api';
  }
  
  const hostname = window.location.hostname;
  
  // Produzione
  if (hostname === 'gaurosa.it' || hostname === 'www.gaurosa.it') {
    return '/api';
  }
  
  // Sviluppo locale - XAMPP
  return 'http://localhost/gaurosa-site/api';
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
 * Fetch lista prodotti
 */
export async function fetchProducts(params?: {
  categoria?: string;
  sottocategoria?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const queryParams = new URLSearchParams();
  
  if (params?.categoria) queryParams.set('categoria', params.categoria);
  if (params?.sottocategoria) queryParams.set('sottocategoria', params.sottocategoria);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.sort) queryParams.set('sort', params.sort);
  
  const query = queryParams.toString();
  return apiFetch(`products.php${query ? '?' + query : ''}`);
}

/**
 * Fetch singolo prodotto per codice
 */
export async function fetchProduct(code: string) {
  return apiFetch(`product.php?code=${encodeURIComponent(code)}`);
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
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
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
// AUTENTICAZIONE (TODO: implementare)
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
// CARRELLO (TODO: implementare)
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
