/**
 * Tipi condivisi per il sito gaurosa.it
 */

import type { FC } from 'react';

// ============================================
// PRODOTTI
// ============================================

export interface ProductImage {
  url: string;
  url_medium?: string | null;
  url_thumb?: string | null;
  blur_data_uri?: string | null;
  is_primary: boolean;
  position: number;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  name?: string | null;
  attribute_name?: string | null;
  size: string | null;
  is_virtual?: boolean;
  price: number | null;
  stock: number;
}

export interface Product {
  code: string;
  ean: string | null;
  name: string;
  description: string;
  load_type: ProductLoadType;
  macro_category: string;
  subcategory?: string;
  supplier: string;
  brand?: string;
  price: number;
  compare_at_price?: number | null;
  images: ProductImage[];
  stock: {
    total: number;
    available: boolean;
  };
  variants?: ProductVariant[];
  tags?: ProductTag[];
  attributes?: Record<string, string | number | null>;
}

export type ProductLoadType =
  | 'orologi'
  | 'gioielleria'
  | 'oggettistica'
  | 'accessori'
  | 'produzione_propria'
  | 'carico_peso';

export interface ProductTag {
  code: string;
  label: string;
  color?: string;
  icon?: string;
}

// ============================================
// FILTRI
// ============================================

export interface FilterValue {
  value: string;
  label?: string;
  count: number;
  color?: string;   // For color swatches
  icon?: string;     // For tag icons
}

export interface Filter {
  code: string;
  label: string;
  type: 'checkbox' | 'color' | 'tag' | 'range';
  values: FilterValue[];
}

export interface PriceRange {
  min: number;
  max: number;
  avg: number;
}

export interface FiltersResponse {
  filters: Filter[];
  price_range: PriceRange;
  total_filtered: number;
}

/** Active filter selections (key = filter code, value = selected values) */
export interface ActiveFilters {
  sottocategoria?: string[];
  material?: string[];
  material_color?: string[];
  gender?: string[];
  stone_type?: string[];
  tag?: string[];
  price_min?: number;
  price_max?: number;
}

// ============================================
// CARRELLO
// ============================================

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

// ============================================
// CHECKOUT
// ============================================

export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Address {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface InvoiceData {
  customerType: 'privato' | 'azienda';
  ragioneSociale?: string;       // Solo azienda
  codiceFiscale?: string;        // Privato o azienda
  partitaIva?: string;           // Solo azienda
  codiceSdi?: string;            // Codice univoco SDI
  pec?: string;                  // PEC per fatturazione elettronica
}

export interface CheckoutData {
  customer: CustomerInfo;
  shippingAddress: Address;
  billingAddress?: Address;       // Solo se diverso da spedizione
  sameAsBilling: boolean;         // true = fatturazione = spedizione
  requiresInvoice: boolean;       // Toggle "Richiedi fattura"
  invoiceData?: InvoiceData;      // Dati fatturazione (se richiesta)
  notes?: string;
  paymentMethod: 'card' | 'klarna' | 'paypal' | 'bank_transfer';
}

// ============================================
// ORDINI
// ============================================

export type OrderStatus =
  | 'new'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: CartItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  createdAt: string;
}

// ============================================
// UI
// ============================================

export interface NavigationItem {
  label: string;
  href: string;
  icon?: FC;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
