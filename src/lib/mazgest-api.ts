/**
 * MazGest API Client
 *
 * Gestisce tutte le chiamate API verso il backend MazGest
 * Endpoint base: /ecommerce/*
 */

const API_URL = process.env.NEXT_PUBLIC_MAZGEST_API_URL || 'http://localhost:5000';
const API_KEY = process.env.MAZGEST_API_KEY || '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * Fetch wrapper con autenticazione API Key
 */
async function mazgestFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Costruisci URL con query params
  let url = `${API_URL}/ecommerce${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// PRODOTTI
// ============================================

export interface Product {
  code: string;
  ean: string | null;
  name: string;
  description: string;
  load_type: string;
  macro_category: string;
  supplier: string;
  price: number;
  cost: number;
  status: string;
  images: {
    url: string;
    is_primary: boolean;
    position: number;
  }[];
  stock: {
    total: number;
    available: boolean;
  };
  updatedAt: string;
  // Dettagli opzionali
  watch_details?: {
    brand: string;
    type: string;
    gender: string;
    collection: string;
    reference: string;
  };
  jewelry_details?: {
    material: string;
    gemstone: string;
    weight: number;
  };
  variants?: {
    sku: string;
    size: string;
    price: number;
    stock: number;
  }[];
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

/**
 * Ottieni lista prodotti
 */
export async function getProducts(options?: {
  category?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductsResponse> {
  return mazgestFetch<ProductsResponse>('/products', {
    params: options,
    next: { revalidate: 60 }, // Cache 1 minuto
  });
}

/**
 * Ottieni singolo prodotto
 */
export async function getProduct(code: string): Promise<ProductResponse> {
  return mazgestFetch<ProductResponse>(`/products/${code}`, {
    next: { revalidate: 60 },
  });
}

/**
 * Ottieni stock prodotto in tempo reale
 */
export async function getProductStock(code: string): Promise<{
  success: boolean;
  data: {
    product_code: string;
    status: string;
    total_quantity: number;
    available: boolean;
    variants?: { variant_sku: string; size: string; quantity: number }[];
  };
}> {
  return mazgestFetch(`/stock/${code}`, {
    cache: 'no-store', // Sempre fresh
  });
}

// ============================================
// CATEGORIE E BRAND
// ============================================

export async function getCategories(): Promise<{
  success: boolean;
  data: { load_type: string; macro_category: string; product_count: number }[];
}> {
  return mazgestFetch('/categories', {
    next: { revalidate: 300 }, // Cache 5 minuti
  });
}

export async function getBrands(): Promise<{
  success: boolean;
  data: { id: number; name: string }[];
}> {
  return mazgestFetch('/brands', {
    next: { revalidate: 300 },
  });
}

// ============================================
// ORDINI
// ============================================

export interface OrderItem {
  product_code: string;
  variant_sku?: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderData {
  order_number: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  billing_address: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  shipping_address?: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  payment: {
    method: string;
    transaction_id?: string;
    status: 'pending' | 'paid' | 'failed';
  };
  notes?: string;
}

/**
 * Crea nuovo ordine
 */
export async function createOrder(data: CreateOrderData): Promise<{
  success: boolean;
  data: {
    mazgest_order_id: number;
    external_order_number: string;
    status: string;
    items_count: number;
    message: string;
  };
}> {
  return mazgestFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Genera numero ordine univoco
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GAU-${year}${month}${day}-${random}`;
}
