'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Package, 
  Mail, 
  ArrowRight,
  ShoppingBag,
  Home,
  Landmark,
  Copy,
  Clock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

interface OrderDetails {
  orderId: number;
  orderNumber: string;
  total: number;
  email: string;
  status: string;
  paymentStatus: string;
}

type ConfirmationStatus = 'loading' | 'success' | 'error';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [isBankTransfer, setIsBankTransfer] = useState(false);
  const [copiedField, setCopiedField] = useState<string>('');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  useEffect(() => {
    async function confirmOrder() {
      const paymentMethod = searchParams.get('payment_method');
      const redirectStatus = searchParams.get('redirect_status');
      const orderId = searchParams.get('order_id');

      // Bank transfer flow
      if (paymentMethod === 'bank_transfer') {
        setIsBankTransfer(true);
        const orderNumber = searchParams.get('order_number') || '';
        const total = parseFloat(searchParams.get('total') || '0');

        // Load bank details from sessionStorage
        try {
          const storedBankDetails = sessionStorage.getItem('bankDetails');
          if (storedBankDetails) {
            setBankDetails(JSON.parse(storedBankDetails));
            sessionStorage.removeItem('bankDetails');
          }
        } catch {}

        setOrder({
          orderId: orderId ? parseInt(orderId) : 0,
          orderNumber,
          total,
          email: '',
          status: 'pending',
          paymentStatus: 'awaiting_payment',
        });
        setStatus('success');
        clearCart();
        return;
      }

      // PayPal flow
      if (paymentMethod === 'paypal') {
        const paypalOrderId = searchParams.get('paypal_order_id');

        if (!paypalOrderId || !orderId) {
          setStatus('error');
          setErrorMessage('Parametri ordine mancanti. Controlla la tua email per la conferma.');
          return;
        }

        if (redirectStatus === 'succeeded') {
          // PayPal payment was already captured in the checkout page
          // Just show success - the capture already happened
          try {
            // Fetch order details from our API
            const response = await fetch(`/api/orders.php?id=${orderId}`, {
              credentials: 'include',
            });
            const data = await response.json();

            if (data.success && data.order) {
              setOrder({
                orderId: data.order.id,
                orderNumber: data.order.orderNumber,
                total: data.order.total,
                email: data.order.customerEmail || '',
                status: data.order.status,
                paymentStatus: data.order.paymentStatus,
              });
            } else {
              // Order details not available but payment succeeded
              setOrder({
                orderId: parseInt(orderId),
                orderNumber: '',
                total: 0,
                email: '',
                status: 'processing',
                paymentStatus: 'paid',
              });
            }
          } catch {
            setOrder({
              orderId: parseInt(orderId),
              orderNumber: '',
              total: 0,
              email: '',
              status: 'processing',
              paymentStatus: 'paid',
            });
          }
          setStatus('success');
          clearCart();
          return;
        }

        setStatus('error');
        setErrorMessage('Il pagamento PayPal non è stato completato.');
        return;
      }

      // Stripe flow
      const paymentIntent = searchParams.get('payment_intent');

      if (!paymentIntent && !orderId) {
        setStatus('error');
        setErrorMessage('Parametri ordine mancanti. Controlla la tua email per la conferma.');
        return;
      }

      // If Stripe says payment failed
      if (redirectStatus === 'failed') {
        setStatus('error');
        setErrorMessage('Il pagamento non è andato a buon fine. Nessun addebito è stato effettuato.');
        return;
      }

      try {
        // Confirm the order with our backend
        const response = await fetch('/api/checkout/confirm-order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId: paymentIntent,
            orderId: orderId ? parseInt(orderId) : undefined,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setOrder({
            orderId: data.order?.id || data.orderId,
            orderNumber: data.order?.orderNumber || data.orderNumber || 'N/A',
            total: data.order?.total || 0,
            email: data.order?.customerEmail || '',
            status: data.order?.status || 'processing',
            paymentStatus: data.order?.paymentStatus || 'paid',
          });
          setStatus('success');

          // Clear the cart after successful order
          clearCart();
        } else {
          // Payment might still be processing
          if (redirectStatus === 'succeeded' || redirectStatus === 'processing') {
            setOrder({
              orderId: 0,
              orderNumber: '',
              total: 0,
              email: '',
              status: 'processing',
              paymentStatus: 'processing',
            });
            setStatus('success');
            clearCart();
          } else {
            setStatus('error');
            setErrorMessage(data.error || 'Errore nella conferma dell\'ordine');
          }
        }
      } catch {
        // Network error but payment might have succeeded
        if (redirectStatus === 'succeeded') {
          setOrder({
            orderId: 0,
            orderNumber: '',
            total: 0,
            email: '',
            status: 'processing',
            paymentStatus: 'paid',
          });
          setStatus('success');
          clearCart();
        } else {
          setStatus('error');
          setErrorMessage('Errore di connessione. Se hai completato il pagamento, riceverai una email di conferma.');
        }
      }
    }

    confirmOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Loading */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-brand-rose animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Conferma in corso...
            </h1>
            <p className="text-gray-500">
              Stiamo verificando il tuo pagamento
            </p>
          </motion.div>
        )}

        {/* Success */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  isBankTransfer ? 'bg-amber-100' : 'bg-green-100'
                }`}
              >
                {isBankTransfer ? (
                  <Landmark className="w-14 h-14 text-amber-600" />
                ) : (
                  <CheckCircle className="w-14 h-14 text-green-500" />
                )}
              </motion.div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {isBankTransfer ? 'Ordine registrato!' : 'Ordine confermato!'}
              </h1>

              <p className="text-lg text-gray-600 mb-2">
                {isBankTransfer 
                  ? 'Completa il pagamento tramite bonifico bancario' 
                  : 'Grazie per il tuo acquisto'}
              </p>

              {order?.orderNumber && order.orderNumber !== 'N/A' && (
                <div className="inline-flex items-center gap-2 bg-gray-50 rounded-full px-6 py-3 mt-4">
                  <Package className="w-5 h-5 text-brand-rose" />
                  <span className="text-gray-600">Ordine n.</span>
                  <span className="font-bold text-brand-rose text-lg">
                    {order.orderNumber}
                  </span>
                </div>
              )}

              {order?.total ? (
                <p className="text-2xl font-bold text-gray-900 mt-6">
                  {formatPrice(order.total)}
                </p>
              ) : null}
            </div>

            {/* Bank Transfer Details */}
            {isBankTransfer && bankDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-8 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-rose/10 rounded-full flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-brand-rose" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Coordinate Bancarie</h2>
                </div>

                <div className="space-y-4">
                  {/* Intestatario */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Intestatario</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{bankDetails.accountHolder}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bankDetails.accountHolder, 'holder')}
                      className="p-2 text-gray-400 hover:text-brand-rose transition-colors"
                      title="Copia"
                    >
                      {copiedField === 'holder' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* IBAN */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">IBAN</p>
                      <p className="font-mono font-bold text-brand-rose text-lg mt-0.5">{bankDetails.iban}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bankDetails.iban, 'iban')}
                      className="p-2 text-gray-400 hover:text-brand-rose transition-colors"
                      title="Copia IBAN"
                    >
                      {copiedField === 'iban' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Banca + Filiale */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Banca</p>
                      <p className="font-medium text-gray-900 mt-0.5 text-sm">{bankDetails.bankName}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">BIC/SWIFT</p>
                      <p className="font-mono font-medium text-gray-900 mt-0.5">{bankDetails.swift}</p>
                    </div>
                  </div>

                  {/* Importo + Causale */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-brand-pink-light rounded-lg border border-brand-rose/20">
                        <div>
                          <p className="text-xs text-brand-rose-dark uppercase tracking-wider">Importo</p>
                          <p className="font-bold text-brand-rose text-xl mt-0.5">&euro; {bankDetails.amount}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bankDetails.amount, 'amount')}
                          className="p-2 text-brand-rose/50 hover:text-brand-rose transition-colors"
                          title="Copia importo"
                        >
                          {copiedField === 'amount' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-brand-pink-light rounded-lg border border-brand-rose/20">
                        <div>
                          <p className="text-xs text-brand-rose-dark uppercase tracking-wider">Causale</p>
                          <p className="font-bold text-brand-rose mt-0.5">{bankDetails.reference}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bankDetails.reference, 'reference')}
                          className="p-2 text-brand-rose/50 hover:text-brand-rose transition-colors"
                          title="Copia causale"
                        >
                          {copiedField === 'reference' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Importante</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Indica il numero ordine <strong>{bankDetails.reference}</strong> nella causale del bonifico. 
                      L'ordine sarà elaborato dopo la ricezione del pagamento (1-2 giorni lavorativi).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Cards */}
            <div className={`grid grid-cols-1 ${isBankTransfer ? '' : 'md:grid-cols-2'} gap-4 mb-6`}>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {isBankTransfer ? 'Email con istruzioni' : 'Email di conferma'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {isBankTransfer ? (
                    'Ti abbiamo inviato una email con le coordinate bancarie e le istruzioni per il bonifico.'
                  ) : order?.email ? (
                    <>Riceverai una conferma a <strong>{order.email}</strong></>
                  ) : (
                    'Riceverai una email di conferma con i dettagli del tuo ordine.'
                  )}
                </p>
              </div>

              {!isBankTransfer && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Spedizione</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Il tuo ordine sarà preparato e spedito entro 1-2 giorni lavorativi. 
                    Riceverai il codice di tracciamento via email.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/prodotti" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continua lo shopping
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button size="lg" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Torna alla home
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Qualcosa non ha funzionato
            </h1>

            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {errorMessage}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/carrello">
                <Button variant="outline" size="lg">
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Torna al carrello
                </Button>
              </Link>
              <Link href="/contatti">
                <Button size="lg">
                  Contattaci per assistenza
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <Loader2 className="w-10 h-10 text-brand-rose animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Caricamento...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
