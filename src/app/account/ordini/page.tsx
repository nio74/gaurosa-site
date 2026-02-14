'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  MapPin,
  Receipt,
  Loader2,
  ShoppingBag,
  Eye
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice, cn } from '@/lib/utils';

// Types
interface OrderItem {
  id: number;
  productCode: string;
  productName: string;
  productSlug: string | null;
  variantSku: string | null;
  variantName: string | null;
  orderedSize: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumb: string | null;
}

interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface OrderSummary {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  subtotal: number;
  shippingTotal: number;
  total: number;
  paymentMethod: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  date: string;
  datetime: string;
  itemCount: number;
  previews: Array<{ name: string; thumb: string | null }>;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  date: string;
  paidDate: string | null;
  shippedDate: string | null;
  completedDate: string | null;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingAddress: Address;
  billingAddress: Address;
  requiresInvoice: boolean;
  invoiceType: string | null;
  invoiceNumber: string | null;
  customerNotes: string | null;
  items: OrderItem[];
}

interface OrdersResponse {
  success: boolean;
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderDetailResponse {
  success: boolean;
  order: OrderDetail;
}

// Image base URL utility
function getImageBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://gaurosa.it';
  }
  
  const hostname = window.location.hostname;
  
  if (hostname === 'gaurosa.it' || hostname === 'www.gaurosa.it') {
    return '';
  }
  
  return 'http://localhost/gaurosa-site';
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: 'In attesa', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    processing: { label: 'In preparazione', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    shipped: { label: 'Spedito', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    completed: { label: 'Completato', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: 'Annullato', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

// Payment status badge component
function PaymentStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    paid: { label: 'Pagato', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    pending: { label: 'In attesa', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    failed: { label: 'Fallito', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    refunded: { label: 'Rimborsato', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Receipt },
    partially_refunded: { label: 'Rimborso parziale', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Receipt },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Order timeline component
function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = [
    { 
      key: 'ordered', 
      label: 'Ordinato', 
      date: order.date, 
      completed: true,
      icon: ShoppingBag
    },
    { 
      key: 'paid', 
      label: 'Pagato', 
      date: order.paidDate, 
      completed: order.paymentStatus === 'paid',
      icon: CreditCard
    },
    { 
      key: 'processing', 
      label: 'In preparazione', 
      date: null, 
      completed: ['processing', 'shipped', 'completed'].includes(order.status),
      icon: Package
    },
    { 
      key: 'shipped', 
      label: 'Spedito', 
      date: order.shippedDate, 
      completed: ['shipped', 'completed'].includes(order.status),
      icon: Truck
    },
    { 
      key: 'delivered', 
      label: 'Consegnato', 
      date: order.completedDate, 
      completed: order.status === 'completed',
      icon: CheckCircle
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Stato dell'ordine</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600 border-2 border-green-200' 
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-8 mt-2 ${
                    step.completed ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-gray-500 mt-1">{step.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Product thumbnail component
function ProductThumbnails({ previews }: { previews: Array<{ name: string; thumb: string | null }> }) {
  const imageBaseUrl = getImageBaseUrl();
  const maxVisible = 3;
  const remaining = Math.max(0, previews.length - maxVisible);

  return (
    <div className="flex -space-x-2">
      {previews.slice(0, maxVisible).map((item, index) => (
        <div
          key={index}
          className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden"
          title={item.name}
        >
          {item.thumb ? (
            <img
              src={`${imageBaseUrl}${item.thumb}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  // Check auth and fetch orders on mount
  useEffect(() => {
    async function initializePage() {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.success || !authData.user) {
          router.push('/account');
          return;
        }

        // Fetch orders
        const ordersResponse = await fetch('/api/orders', {
          credentials: 'include'
        });
        const ordersData: OrdersResponse = await ordersResponse.json();

        if (ordersData.success) {
          setOrders(ordersData.orders);
        } else {
          setError('Errore nel caricamento degli ordini');
        }
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Errore di connessione');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  // Fetch order detail
  const handleViewOrder = async (orderId: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        credentials: 'include'
      });
      const data: OrderDetailResponse = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
      } else {
        setError('Errore nel caricamento del dettaglio ordine');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Errore di connessione');
    } finally {
      setLoadingDetail(false);
    }
  };

  const imageBaseUrl = getImageBaseUrl();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-rose mx-auto mb-4" />
          <p className="text-gray-600">Caricamento ordini...</p>
        </div>
      </div>
    );
  }

  // Order detail view
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/account" className="hover:text-gray-700">Account</Link>
              <span>/</span>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="hover:text-gray-700"
              >
                I miei ordini
              </button>
              <span>/</span>
              <span className="text-gray-900">{selectedOrder.orderNumber}</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Ordine {selectedOrder.orderNumber}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedOrder.date}
                  </div>
                  <StatusBadge status={selectedOrder.status} />
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(selectedOrder.total)}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedOrder.items.length} {selectedOrder.items.length === 1 ? 'articolo' : 'articoli'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Order timeline and tracking */}
              <div className="space-y-6">
                <OrderTimeline order={selectedOrder} />
                
                {/* Tracking info */}
                {selectedOrder.trackingNumber && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracciamento spedizione</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Numero di tracciamento</p>
                        <p className="text-sm text-gray-900 font-mono">{selectedOrder.trackingNumber}</p>
                      </div>
                      {selectedOrder.trackingUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedOrder.trackingUrl!, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Traccia spedizione
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping address */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo di spedizione</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>
                      {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city} ({selectedOrder.shippingAddress.province})
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Right column - Order items and totals */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order items */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Articoli ordinati</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-6 flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.thumb ? (
                            <img
                              src={`${imageBaseUrl}${item.thumb}`}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{item.productName}</h4>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Codice: {item.productCode}</p>
                            {item.variantName && <p>Variante: {item.variantName}</p>}
                            {item.orderedSize && <p>Misura: {item.orderedSize}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.totalPrice)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order totals */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo ordine</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotale</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spedizione</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.shippingTotal)}</span>
                    </div>
                    {selectedOrder.taxTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IVA</span>
                        <span className="text-gray-900">{formatPrice(selectedOrder.taxTotal)}</span>
                      </div>
                    )}
                    {selectedOrder.discountTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sconto</span>
                        <span className="text-green-600">-{formatPrice(selectedOrder.discountTotal)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Totale</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(selectedOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Metodo di pagamento:</span> {selectedOrder.paymentMethod}</p>
                      <p><span className="font-medium">Metodo di spedizione:</span> {selectedOrder.shippingMethod}</p>
                      {selectedOrder.invoiceNumber && (
                        <p><span className="font-medium">Fattura:</span> {selectedOrder.invoiceNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/account" className="hover:text-gray-700">Account</Link>
            <span>/</span>
            <span className="text-gray-900">I miei ordini</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">I miei ordini</h1>
              <p className="text-gray-600 mt-2">
                Visualizza e gestisci i tuoi ordini
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/account')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna all'account
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Orders list */}
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun ordine trovato
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Non hai ancora effettuato nessun ordine. Scopri la nostra collezione di gioielli e orologi.
              </p>
              <Button
                onClick={() => router.push('/prodotti')}
                size="lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Inizia a comprare
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Product previews and info */}
                      <div className="flex items-center gap-4">
                        <ProductThumbnails previews={order.previews} />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Ordine {order.orderNumber}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {order.date}
                            </div>
                            <span>•</span>
                            <span>
                              {order.itemCount} {order.itemCount === 1 ? 'articolo' : 'articoli'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Status, total, and action */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={order.status} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                          {order.trackingNumber && order.status === 'shipped' && (
                            <p className="text-xs text-gray-500">
                              Tracciamento disponibile
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.paymentMethod}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loadingDetail}
                        >
                          {loadingDetail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Dettagli
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}