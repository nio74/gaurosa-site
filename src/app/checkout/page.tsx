'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  FileText, 
  CreditCard, 
  ShoppingBag,
  Truck,
  Receipt,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { useCart, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/hooks/useCart';
import { formatPrice, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { CheckoutData, CustomerInfo, Address, InvoiceData } from '@/types';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface FormErrors {
  [key: string]: string;
}

interface PaymentStepProps {
  checkoutData: CheckoutData;
  clientSecret: string;
  orderId: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Payment Step Component (wrapped in Elements)
function PaymentStep({ checkoutData, clientSecret, orderId, onSuccess, onError }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { cart } = useCart();

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe non ancora caricato. Riprova tra un momento.');
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/ordine/conferma`,
        },
      });

      if (error) {
        onError(error.message || 'Errore durante il pagamento');
      } else {
        // Payment successful, confirm order with backend
        // Extract paymentIntentId from clientSecret (format: pi_xxx_secret_xxx)
        const paymentIntentId = clientSecret.split('_secret_')[0];

        const response = await fetch('/api/checkout/confirm-order.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId,
            orderId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          onSuccess();
        } else {
          // Payment succeeded but confirm failed - not critical, webhook will handle it
          console.warn('Confirm order failed, webhook will handle:', result.error);
          onSuccess();
        }
      }
    } catch (err) {
      onError('Errore di rete. Riprova tra un momento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg border-2 border-brand-rose p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-brand-rose" />
          Inserisci i dati di pagamento
        </h3>
        
        <div className="mb-6">
          <PaymentElement />
        </div>

        <Button
          onClick={handlePayment}
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Elaborazione pagamento...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Paga {formatPrice(cart.total)}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          I tuoi dati sono protetti con crittografia SSL a 256 bit
        </p>
      </div>
    </motion.div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoaded, clearCart } = useCart();
  
  // Form state
  const [formData, setFormData] = useState<CheckoutData>({
    customer: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
    shippingAddress: {
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Italia',
    },
    sameAsBilling: true,
    requiresInvoice: false,
    paymentMethod: 'card',
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  // Redirect if cart is empty (only after cart is loaded from localStorage)
  useEffect(() => {
    if (isLoaded && cart.items.length === 0 && !showPayment) {
      router.push('/carrello');
    }
  }, [isLoaded, cart.items.length, router, showPayment]);

  // Try to fetch user data if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            setFormData(prev => ({
              ...prev,
              customer: {
                email: userData.user.email || '',
                firstName: userData.user.firstName || '',
                lastName: userData.user.lastName || '',
                phone: userData.user.phone || '',
              },
            }));
          }
        }
      } catch (error) {
        // Silently fail - user not logged in
        console.log('User not logged in');
      }
    };

    fetchUserData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Customer validation
    if (!formData.customer.email) newErrors.email = 'Email richiesta';
    if (!formData.customer.firstName) newErrors.firstName = 'Nome richiesto';
    if (!formData.customer.lastName) newErrors.lastName = 'Cognome richiesto';
    if (!formData.customer.phone) newErrors.phone = 'Telefono richiesto';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.customer.email && !emailRegex.test(formData.customer.email)) {
      newErrors.email = 'Email non valida';
    }

    // Shipping address validation
    if (!formData.shippingAddress.address) newErrors.address = 'Indirizzo richiesto';
    if (!formData.shippingAddress.city) newErrors.city = 'Città richiesta';
    if (!formData.shippingAddress.province) newErrors.province = 'Provincia richiesta';
    if (!formData.shippingAddress.postalCode) newErrors.postalCode = 'CAP richiesto';

    // Invoice validation
    if (formData.requiresInvoice && formData.invoiceData) {
      if (!formData.invoiceData.codiceFiscale) {
        newErrors.codiceFiscale = 'Codice fiscale richiesto';
      }
      
      if (formData.invoiceData.customerType === 'azienda') {
        if (!formData.invoiceData.ragioneSociale) {
          newErrors.ragioneSociale = 'Ragione sociale richiesta';
        }
        if (!formData.invoiceData.partitaIva) {
          newErrors.partitaIva = 'Partita IVA richiesta';
        }
      }
    }

    // Billing address validation (if different)
    if (!formData.sameAsBilling && formData.billingAddress) {
      if (!formData.billingAddress.address) newErrors.billingAddress = 'Indirizzo fatturazione richiesto';
      if (!formData.billingAddress.city) newErrors.billingCity = 'Città fatturazione richiesta';
      if (!formData.billingAddress.province) newErrors.billingProvince = 'Provincia fatturazione richiesta';
      if (!formData.billingAddress.postalCode) newErrors.billingPostalCode = 'CAP fatturazione richiesto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const parent = prev[keys[0] as keyof CheckoutData];
        return {
          ...prev,
          [keys[0]]: {
            ...(typeof parent === 'object' && parent !== null ? parent : {}),
            [keys[1]]: value,
          },
        };
      } else if (keys.length === 3) {
        const parent = prev[keys[0] as keyof CheckoutData] as any;
        return {
          ...prev,
          [keys[0]]: {
            ...(typeof parent === 'object' && parent !== null ? parent : {}),
            [keys[1]]: {
              ...(typeof parent?.[keys[1]] === 'object' && parent?.[keys[1]] !== null ? parent[keys[1]] : {}),
              [keys[2]]: value,
            },
          },
        };
      }
      return prev;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    setGeneralError('');
    
    if (!validateForm()) {
      setGeneralError('Compila tutti i campi richiesti');
      return;
    }

    setIsLoading(true);

    try {
      // Transform cart items to the format PHP expects
      const items = cart.items.map(item => ({
        productCode: item.product.code,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.variant?.price || item.product.price,
        variantSku: item.variant?.sku || null,
        variantName: item.variant?.name || item.variant?.size || null,
        isVirtualVariant: item.variant?.is_virtual || false,
        orderedSize: item.variant?.size || null,
      }));

      const response = await fetch('/api/checkout/create-payment-intent.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items,
          customer: {
            email: formData.customer.email,
            name: `${formData.customer.firstName} ${formData.customer.lastName}`.trim(),
            phone: formData.customer.phone,
          },
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.sameAsBilling ? null : formData.billingAddress,
          requiresInvoice: formData.requiresInvoice,
          invoiceData: formData.requiresInvoice ? formData.invoiceData : null,
          notes: formData.notes || '',
          paymentMethod: formData.paymentMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setClientSecret(result.clientSecret);
        setOrderId(result.orderId);
        setShowPayment(true);
      } else {
        setGeneralError(result.error || 'Errore nella creazione del pagamento');
      }
    } catch (error) {
      setGeneralError('Errore di rete. Riprova tra un momento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    const piId = clientSecret.split('_secret_')[0];
    router.push(`/ordine/conferma?payment_intent=${piId}&order_id=${orderId}&redirect_status=succeeded`);
  };

  const handlePaymentError = (error: string) => {
    setGeneralError(error);
    setShowPayment(false);
    setClientSecret('');
  };

  if (cart.items.length === 0) {
    return null; // Will redirect
  }

  // Show loading while cart loads from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-rose animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Completa il tuo ordine</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!showPayment ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* General Error */}
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
                    >
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                      <span className="text-red-700">{generalError}</span>
                    </motion.div>
                  )}

                  {/* Customer Info */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <User className="h-5 w-5 mr-2 text-brand-rose" />
                      Dati Personali
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.customer.email}
                          onChange={(e) => handleInputChange('customer.email', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="mario.rossi@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          Nome *
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          required
                          value={formData.customer.firstName}
                          onChange={(e) => handleInputChange('customer.firstName', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.firstName ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="Mario"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Cognome *
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          required
                          value={formData.customer.lastName}
                          onChange={(e) => handleInputChange('customer.lastName', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.lastName ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="Rossi"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Telefono *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={formData.customer.phone}
                          onChange={(e) => handleInputChange('customer.phone', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.phone ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="+39 123 456 7890"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </motion.section>

                  {/* Shipping Address */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-brand-rose" />
                      Indirizzo di Spedizione
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Indirizzo *
                        </label>
                        <input
                          id="address"
                          type="text"
                          required
                          value={formData.shippingAddress.address}
                          onChange={(e) => handleInputChange('shippingAddress.address', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.address ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="Via Roma, 123"
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          Città *
                        </label>
                        <input
                          id="city"
                          type="text"
                          required
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.city ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="Milano"
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                          Provincia *
                        </label>
                        <input
                          id="province"
                          type="text"
                          required
                          value={formData.shippingAddress.province}
                          onChange={(e) => handleInputChange('shippingAddress.province', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.province ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="MI"
                        />
                        {errors.province && (
                          <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                          CAP *
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          required
                          value={formData.shippingAddress.postalCode}
                          onChange={(e) => handleInputChange('shippingAddress.postalCode', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                            errors.postalCode ? 'border-red-300' : 'border-gray-300'
                          )}
                          placeholder="20100"
                        />
                        {errors.postalCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Nazione
                        </label>
                        <input
                          id="country"
                          type="text"
                          value={formData.shippingAddress.country}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </motion.section>

                  {/* Invoice Section */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Receipt className="h-5 w-5 mr-2 text-brand-rose" />
                      Fatturazione
                    </h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.requiresInvoice}
                          onChange={(e) => {
                            handleInputChange('requiresInvoice', e.target.checked);
                            if (!e.target.checked) {
                              handleInputChange('invoiceData', undefined);
                            } else {
                              handleInputChange('invoiceData', {
                                customerType: 'privato',
                                codiceFiscale: '',
                              });
                            }
                          }}
                          className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Richiedi fattura
                        </span>
                      </label>

                      <AnimatePresence>
                        {formData.requiresInvoice && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            {/* Customer Type */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo cliente
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="customerType"
                                    value="privato"
                                    checked={formData.invoiceData?.customerType === 'privato'}
                                    onChange={(e) => handleInputChange('invoiceData.customerType', e.target.value)}
                                    className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Privato</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="customerType"
                                    value="azienda"
                                    checked={formData.invoiceData?.customerType === 'azienda'}
                                    onChange={(e) => handleInputChange('invoiceData.customerType', e.target.value)}
                                    className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Azienda</span>
                                </label>
                              </div>
                            </div>

                            {/* Company fields */}
                            {formData.invoiceData?.customerType === 'azienda' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label htmlFor="ragioneSociale" className="block text-sm font-medium text-gray-700 mb-1">
                                    Ragione Sociale *
                                  </label>
                                  <input
                                    id="ragioneSociale"
                                    type="text"
                                    value={formData.invoiceData?.ragioneSociale || ''}
                                    onChange={(e) => handleInputChange('invoiceData.ragioneSociale', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.ragioneSociale ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="Azienda S.r.l."
                                  />
                                  {errors.ragioneSociale && (
                                    <p className="text-red-500 text-sm mt-1">{errors.ragioneSociale}</p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="partitaIva" className="block text-sm font-medium text-gray-700 mb-1">
                                    Partita IVA *
                                  </label>
                                  <input
                                    id="partitaIva"
                                    type="text"
                                    value={formData.invoiceData?.partitaIva || ''}
                                    onChange={(e) => handleInputChange('invoiceData.partitaIva', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.partitaIva ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="12345678901"
                                  />
                                  {errors.partitaIva && (
                                    <p className="text-red-500 text-sm mt-1">{errors.partitaIva}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Codice Fiscale (always shown when invoice required) */}
                            <div>
                              <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700 mb-1">
                                Codice Fiscale *
                              </label>
                              <input
                                id="codiceFiscale"
                                type="text"
                                value={formData.invoiceData?.codiceFiscale || ''}
                                onChange={(e) => handleInputChange('invoiceData.codiceFiscale', e.target.value)}
                                className={cn(
                                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                  errors.codiceFiscale ? 'border-red-300' : 'border-gray-300'
                                )}
                                placeholder="RSSMRA80A01H501U"
                              />
                              {errors.codiceFiscale && (
                                <p className="text-red-500 text-sm mt-1">{errors.codiceFiscale}</p>
                              )}
                            </div>

                            {/* Optional fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="codiceSdi" className="block text-sm font-medium text-gray-700 mb-1">
                                  Codice SDI <span className="text-gray-400">(opzionale)</span>
                                </label>
                                <input
                                  id="codiceSdi"
                                  type="text"
                                  value={formData.invoiceData?.codiceSdi || ''}
                                  onChange={(e) => handleInputChange('invoiceData.codiceSdi', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors"
                                  placeholder="ABCDEFG"
                                />
                              </div>

                              <div>
                                <label htmlFor="pec" className="block text-sm font-medium text-gray-700 mb-1">
                                  PEC <span className="text-gray-400">(opzionale)</span>
                                </label>
                                <input
                                  id="pec"
                                  type="email"
                                  value={formData.invoiceData?.pec || ''}
                                  onChange={(e) => handleInputChange('invoiceData.pec', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors"
                                  placeholder="azienda@pec.it"
                                />
                              </div>
                            </div>

                            {/* Different billing address */}
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!formData.sameAsBilling}
                                onChange={(e) => {
                                  handleInputChange('sameAsBilling', !e.target.checked);
                                  if (e.target.checked) {
                                    handleInputChange('billingAddress', {
                                      address: '',
                                      city: '',
                                      province: '',
                                      postalCode: '',
                                      country: 'Italia',
                                    });
                                  } else {
                                    handleInputChange('billingAddress', undefined);
                                  }
                                }}
                                className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                Indirizzo di fatturazione diverso da quello di spedizione
                              </span>
                            </label>

                            {/* Billing address fields */}
                            {!formData.sameAsBilling && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="md:col-span-2">
                                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Indirizzo Fatturazione *
                                  </label>
                                  <input
                                    id="billingAddress"
                                    type="text"
                                    value={formData.billingAddress?.address || ''}
                                    onChange={(e) => handleInputChange('billingAddress.address', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.billingAddress ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="Via della Fatturazione, 456"
                                  />
                                  {errors.billingAddress && (
                                    <p className="text-red-500 text-sm mt-1">{errors.billingAddress}</p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                                    Città *
                                  </label>
                                  <input
                                    id="billingCity"
                                    type="text"
                                    value={formData.billingAddress?.city || ''}
                                    onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.billingCity ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="Roma"
                                  />
                                  {errors.billingCity && (
                                    <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="billingProvince" className="block text-sm font-medium text-gray-700 mb-1">
                                    Provincia *
                                  </label>
                                  <input
                                    id="billingProvince"
                                    type="text"
                                    value={formData.billingAddress?.province || ''}
                                    onChange={(e) => handleInputChange('billingAddress.province', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.billingProvince ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="RM"
                                  />
                                  {errors.billingProvince && (
                                    <p className="text-red-500 text-sm mt-1">{errors.billingProvince}</p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                                    CAP *
                                  </label>
                                  <input
                                    id="billingPostalCode"
                                    type="text"
                                    value={formData.billingAddress?.postalCode || ''}
                                    onChange={(e) => handleInputChange('billingAddress.postalCode', e.target.value)}
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors',
                                      errors.billingPostalCode ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="00100"
                                  />
                                  {errors.billingPostalCode && (
                                    <p className="text-red-500 text-sm mt-1">{errors.billingPostalCode}</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.section>

                  {/* Notes */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-brand-rose" />
                      Note Ordine
                    </h2>
                    
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Note aggiuntive <span className="text-gray-400">(opzionale)</span>
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-rose focus:border-brand-rose transition-colors resize-none"
                        placeholder="Istruzioni speciali per la consegna..."
                      />
                    </div>
                  </motion.section>

                  {/* Payment Method */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-brand-rose" />
                      Metodo di Pagamento
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Credit Card */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'border-2 rounded-lg p-4 cursor-pointer transition-all',
                          formData.paymentMethod === 'card'
                            ? 'border-brand-rose bg-brand-pink-light'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => handleInputChange('paymentMethod', 'card')}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={formData.paymentMethod === 'card'}
                            onChange={() => handleInputChange('paymentMethod', 'card')}
                            className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300"
                          />
                          <span className="ml-2 font-medium">💳 Carta</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Visa, Mastercard, American Express
                        </p>
                      </motion.div>

                      {/* Klarna */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'border-2 rounded-lg p-4 cursor-pointer transition-all',
                          formData.paymentMethod === 'klarna'
                            ? 'border-brand-rose bg-brand-pink-light'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => handleInputChange('paymentMethod', 'klarna')}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="klarna"
                            checked={formData.paymentMethod === 'klarna'}
                            onChange={() => handleInputChange('paymentMethod', 'klarna')}
                            className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300"
                          />
                          <span className="ml-2 font-medium">🩷 Klarna</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Paga in 3 rate senza interessi
                        </p>
                      </motion.div>

                      {/* PayPal (Disabled) */}
                      <div className="relative">
                        <div className="border-2 border-gray-200 rounded-lg p-4 opacity-50">
                          <div className="flex items-center mb-2">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="paypal"
                              disabled
                              className="h-4 w-4 text-brand-rose focus:ring-brand-rose border-gray-300"
                            />
                            <span className="ml-2 font-medium">🟡 PayPal</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Paga con il tuo account PayPal
                          </p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">
                            Presto disponibile
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.section>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <Button
                      onClick={handleSubmit}
                      isLoading={isLoading}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Preparazione pagamento...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Procedi al pagamento · {formatPrice(cart.total)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Cliccando "Procedi al pagamento" accetti i nostri{' '}
                      <a href="/termini" className="text-brand-rose hover:underline">
                        Termini e Condizioni
                      </a>{' '}
                      e la{' '}
                      <a href="/privacy" className="text-brand-rose hover:underline">
                        Privacy Policy
                      </a>
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#8b1538',
                        },
                      },
                      locale: 'it',
                    }}
                  >
                    <PaymentStep
                      checkoutData={formData}
                      clientSecret={clientSecret}
                      orderId={orderId}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-8"
            >
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-brand-rose" />
                  Riepilogo Ordine
                </h3>

                {/* Cart Items */}
                <div className="space-y-3 mb-6">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={`${item.product.code}-${item.variant?.sku || 'default'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="relative">
                        <img
                          src={item.product.images[0]?.url || '/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <span className="absolute -top-2 -right-2 bg-brand-rose text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-gray-500">
                            {item.variant.name || item.variant.size}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice((item.variant?.price || item.product.price) * item.quantity)}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <hr className="border-gray-200 mb-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotale</span>
                    <span className="text-gray-900">{formatPrice(cart.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Spedizione
                    </span>
                    <span className={cn(
                      cart.shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-900'
                    )}>
                      {cart.shipping === 0 ? 'Gratuita' : formatPrice(cart.shipping)}
                    </span>
                  </div>

                  {cart.shipping === 0 && cart.subtotal < FREE_SHIPPING_THRESHOLD && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Spedizione gratuita applicata!
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA inclusa</span>
                    <span className="text-gray-900">{formatPrice(cart.tax)}</span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Totale</span>
                    <span className="text-brand-rose">{formatPrice(cart.total)}</span>
                  </div>
                </div>

                {/* Free Shipping Progress */}
                {cart.subtotal < FREE_SHIPPING_THRESHOLD && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-brand-pink-light rounded-lg"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-brand-rose-dark font-medium">
                        Spedizione gratuita
                      </span>
                      <span className="text-brand-rose-dark">
                        {formatPrice(FREE_SHIPPING_THRESHOLD - cart.subtotal)} rimanenti
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div
                        className="bg-brand-rose h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}