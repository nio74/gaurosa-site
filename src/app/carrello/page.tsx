'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Truck, Gift, Package } from 'lucide-react';
import { useCart, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = () => {
    if (window.confirm('Sei sicuro di voler svuotare il carrello?')) {
      setIsClearing(true);
      setTimeout(() => {
        clearCart();
        setIsClearing(false);
      }, 300);
    }
  };

  // Carrello vuoto
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Il tuo carrello è vuoto
            </h1>
            <p className="text-gray-500 mb-8">
              Scopri i nostri gioielli e orologi per trovare qualcosa di speciale.
            </p>
            <Link href="/prodotti">
              <Button size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continua lo shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Carrello</h1>
          <button
            onClick={handleClearCart}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Svuota carrello
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => {
                const itemKey = `${item.product.code}-${item.variant?.sku || 'default'}`;
                const price = item.variant?.price || item.product.price;
                const imageUrl = item.product.images[0]?.url || '/images/placeholder-product.jpg';

                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link
                        href={`/prodotti/${item.product.code}`}
                        className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/prodotti/${item.product.code}`}
                          className="block"
                        >
                          <h3 className="font-semibold text-gray-900 truncate hover:text-gray-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500">
                          {item.product.supplier || item.product.macro_category}
                        </p>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            Taglia: {item.variant.size}
                          </p>
                        )}
                        <p className="mt-1 font-semibold text-gray-900">
                          {formatPrice(price)}
                        </p>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.product.code, item.variant?.sku)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Rimuovi"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.code,
                                item.quantity - 1,
                                item.variant?.sku
                              )
                            }
                            className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.code,
                                item.quantity + 1,
                                item.variant?.sku
                              )
                            }
                            className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subtotal per item */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Subtotale ({item.quantity} {item.quantity === 1 ? 'articolo' : 'articoli'})
                      </span>
                      <span className="font-semibold">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Continue shopping link */}
            <div className="pt-4">
              <Link
                href="/prodotti"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continua lo shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm sticky top-24"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Riepilogo ordine
              </h2>

              {/* Free Shipping Progress Bar */}
              {(() => {
                const isFreeShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD;
                const progress = Math.min((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
                const remaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;

                return (
                  <div className={`mb-5 p-4 rounded-xl border-2 transition-all duration-500 ${
                    isFreeShipping
                      ? 'bg-green-50 border-green-200'
                      : 'bg-rose-50/50 border-rose-100'
                  }`}>
                    {isFreeShipping ? (
                      /* Spedizione gratuita raggiunta */
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 text-sm">
                            Complimenti! Spedizione GRATUITA
                          </p>
                          <p className="text-xs text-green-600">
                            Risparmi {formatPrice(SHIPPING_COST)} su questo ordine
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Barra progresso */
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-5 h-5 text-brand-rose" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              Ti mancano <span className="text-brand-rose">{formatPrice(remaining)}</span> per la spedizione gratuita!
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: 'linear-gradient(90deg, #8b1538, #f9c3d5)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-xs text-gray-400">
                            {formatPrice(cart.subtotal)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatPrice(FREE_SHIPPING_THRESHOLD)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotale</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Spedizione</span>
                  {cart.shipping === 0 ? (
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      Gratuita
                    </span>
                  ) : (
                    <span className="font-medium">{formatPrice(cart.shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>di cui IVA (22%)</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Totale</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(cart.total)}
                </span>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full">
                  Procedi al checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              {/* Garanzie */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Spedizione gratuita sopra {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Spedizione assicurata e tracciata</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-2">
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                  VISA
                </div>
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                  MC
                </div>
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-blue-500">
                  PP
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
