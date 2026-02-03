/**
 * Tipi condivisi per il sito gaurosa.it
 */

// ============================================
// PRODOTTI
// ============================================

export interface ProductImage {
  url: string;
  is_primary: boolean;
  position: number;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  name?: string | null;
  size: string | null;
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
  supplier: string;
  price: number;
  images: ProductImage[];
  stock: {
    total: number;
    available: boolean;
  };
  variants?: ProductVariant[];
}

export type ProductLoadType =
  | 'orologi'
  | 'gioielleria'
  | 'oggettistica'
  | 'accessori'
  | 'produzione_propria'
  | 'carico_peso';

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

export interface CheckoutData {
  customer: CustomerInfo;
  billingAddress: Address;
  shippingAddress?: Address;
  sameAsShipping: boolean;
  notes?: string;
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
  icon?: React.ComponentType;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
