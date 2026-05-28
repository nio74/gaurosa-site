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

  // Stock disponibile (single source of truth).
  // IMPORTANTE: per i prodotti con varianti virtuali (es. anelli) tutte le misure
  // virtuali attingono dallo stesso stock fisico. Quindi il limite GLOBALE del
  // prodotto e' product.stock.total (es. M02914 ha 1 anello in tutto), non variant.stock
  // (che per le virtuali e' un valore informativo gonfiato).
  //
  // Regola: somma le quantita' di TUTTE le varianti dello stesso product.code presenti
  // nel carrello e confronta con product.stock.total.
  const getProductMaxStock = (product: Product): number => {
    return Math.max(0, product.stock?.total || 0);
  };

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

    const maxStock = getProductMaxStock(product);

    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) =>
          item.product.code === product.code &&
          item.variant?.sku === variant?.sku
      );

      // Quantita' attualmente nel carrello per QUESTA esatta variante (per aggiornare la riga giusta)
      const currentInCart = existingIndex >= 0 ? prev.items[existingIndex].quantity : 0;

      // Quantita' TOTALE nel carrello per lo stesso PRODOTTO (tutte le varianti).
      // Per varianti virtuali condividono lo stesso stock pool, quindi sommiamo.
      const totalInCartForProduct = prev.items
        .filter((item) => item.product.code === product.code)
        .reduce((sum, item) => sum + item.quantity, 0);
      const requestedTotal = totalInCartForProduct + quantity;

      // Blocco overselling: la somma di tutte le varianti dello stesso prodotto
      // non puo' superare lo stock complessivo del prodotto.
      if (requestedTotal > maxStock) {
        if (typeof window !== 'undefined') {
          const remaining = Math.max(0, maxStock - totalInCartForProduct);
          if (maxStock === 0) {
            alert('Prodotto esaurito.');
          } else if (remaining === 0) {
            const sizesInCart = prev.items
              .filter((item) => item.product.code === product.code)
              .map((item) => item.variant?.size || item.variant?.name || 'unica')
              .join(', ');
            alert(`Hai gia' raggiunto la quantita' massima disponibile (${maxStock} pezzi totali tra tutte le misure).\n\nMisure nel carrello: ${sizesInCart}.\n\nSe vuoi una misura diversa, rimuovi prima quella attuale dal carrello.`);
          } else {
            alert(`Sono disponibili solo ${maxStock} pezzi totali di questo prodotto.\nNel carrello ne hai gia' ${totalInCartForProduct}, puoi aggiungerne al massimo ${remaining}.`);
          }
        }
        // Cap alla quantita' massima disponibile (basato sullo stock globale del prodotto)
        const cappedQuantity = Math.max(0, maxStock - totalInCartForProduct);
        if (cappedQuantity === 0) return prev;

        const newItems: CartItem[] = existingIndex >= 0
          ? prev.items.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + cappedQuantity } : item)
          : [...prev.items, { product, variant, quantity: cappedQuantity }];
        return { items: newItems, ...calculateTotals(newItems) };
      }

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
      const item = prev.items.find(
        (it) => it.product.code === productCode && it.variant?.sku === variantSku
      );
      if (!item) return prev;

      // Blocco overselling globale sul prodotto: somma quantita' di TUTTE le varianti
      // dello stesso prodotto (escludendo quella che stiamo aggiornando) + la nuova quantita'
      // non puo' superare lo stock complessivo del prodotto.
      const maxStock = getProductMaxStock(item.product);
      const totalOthers = prev.items
        .filter((it) => it.product.code === productCode && it.variant?.sku !== variantSku)
        .reduce((sum, it) => sum + it.quantity, 0);

      let finalQty = quantity;
      if (totalOthers + quantity > maxStock) {
        const allowedForThis = Math.max(0, maxStock - totalOthers);
        if (typeof window !== 'undefined') {
          alert(`Stock totale prodotto: ${maxStock} pezzi.\nAltre misure nel carrello: ${totalOthers}.\nPuoi tenerne al massimo ${allowedForThis} di questa misura.`);
        }
        finalQty = allowedForThis;
      }
      if (finalQty <= 0) {
        return {
          items: prev.items.filter(
            (it) => !(it.product.code === productCode && it.variant?.sku === variantSku)
          ),
          ...calculateTotals(prev.items.filter(
            (it) => !(it.product.code === productCode && it.variant?.sku === variantSku)
          )),
        };
      }

      const newItems = prev.items.map((it) =>
        it.product.code === productCode && it.variant?.sku === variantSku
          ? { ...it, quantity: finalQty }
          : it
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
