'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Cart, CartItem, Product, ProductVariant } from '@/types';

interface CartContextType {
  cart: Cart;
  isLoaded: boolean;
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productCode: string, variantSku?: string) => void;
  updateQuantity: (productCode: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'gaurosa-cart';
const SHIPPING_COST = 5.90; // Spedizione standard
const FREE_SHIPPING_THRESHOLD = 45; // Spedizione gratuita sopra questa soglia
const TAX_RATE = 0.22; // IVA 22%

// Exported for use in UI components (progress bar, etc.)
export { SHIPPING_COST, FREE_SHIPPING_THRESHOLD };

function calculateTotals(items: CartItem[]): Omit<Cart, 'items'> {
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Free shipping if subtotal >= threshold
  const shipping = items.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const taxableAmount = subtotal + shipping;
  const tax = taxableAmount * TAX_RATE / (1 + TAX_RATE); // IVA già inclusa
  const total = subtotal + shipping;

  return { subtotal, shipping, tax, total };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica carrello da localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        const items = JSON.parse(saved) as CartItem[];
        setCart({ items, ...calculateTotals(items) });
      } catch (e) {
        console.error('Errore caricamento carrello:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva carrello in localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.items));
  }, [cart.items]);

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    // Fire Meta Pixel AddToCart event
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      const price = variant?.price ?? product.price;
      window.fbq('track', 'AddToCart', {
        content_ids: [product.code],
        content_name: product.name,
        content_type: 'product',
        value: price,
        currency: 'EUR',
      });
    }

    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) =>
          item.product.code === product.code &&
          item.variant?.sku === variant?.sku
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Aggiorna quantità esistente
        newItems = prev.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Aggiungi nuovo item
        newItems = [...prev.items, { product, variant, quantity }];
      }

      return { items: newItems, ...calculateTotals(newItems) };
    });
  };

  const removeFromCart = (productCode: string, variantSku?: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter(
        (item) =>
          !(item.product.code === productCode && item.variant?.sku === variantSku)
      );
      return { items: newItems, ...calculateTotals(newItems) };
    });
  };

  const updateQuantity = (productCode: string, quantity: number, variantSku?: string) => {
    if (quantity <= 0) {
      removeFromCart(productCode, variantSku);
      return;
    }

    setCart((prev) => {
      const newItems = prev.items.map((item) =>
        item.product.code === productCode && item.variant?.sku === variantSku
          ? { ...item, quantity }
          : item
      );
      return { items: newItems, ...calculateTotals(newItems) };
    });
  };

  const clearCart = () => {
    setCart({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 });
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, isLoaded, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
