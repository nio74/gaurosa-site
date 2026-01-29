'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, LogOut, Package, Heart, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';

interface UserData {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    confirmPassword: '',
    marketingConsent: false,
  });

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        // Not logged in
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.user);
          setSuccess('Accesso effettuato!');
        } else {
          setError(data.error || 'Credenziali non valide');
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Le password non coincidono');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            marketingConsent: formData.marketingConsent,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Registrazione completata! Controlla la tua email per verificare l\'account.');
          // Switch to login view
          setTimeout(() => setIsLogin(true), 3000);
        } else {
          const errors = data.errors;
          if (errors) {
            const errorMessages = Object.values(errors).join('. ');
            setError(errorMessages);
          } else {
            setError(data.error || 'Errore durante la registrazione');
          }
        }
      }
    } catch {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      router.refresh();
    } catch {
      setError('Errore durante il logout');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // User is logged in - show account dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Ciao, {user.firstName || 'Cliente'}!
                    </h1>
                    <p className="text-gray-500">{user.email}</p>
                    {!user.emailVerified && (
                      <p className="text-amber-600 text-sm mt-1">
                        Email non verificata - controlla la tua casella
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci
                </Button>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/account/ordini" className="block">
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Package className="w-8 h-8 text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900">I miei ordini</h3>
                  <p className="text-sm text-gray-500">Visualizza lo storico ordini</p>
                </div>
              </Link>

              <Link href="/account/preferiti" className="block">
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Heart className="w-8 h-8 text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900">Preferiti</h3>
                  <p className="text-sm text-gray-500">I tuoi prodotti salvati</p>
                </div>
              </Link>

              <Link href="/account/impostazioni" className="block">
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Settings className="w-8 h-8 text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900">Impostazioni</h3>
                  <p className="text-sm text-gray-500">Modifica i tuoi dati</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Login/Register form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Tabs */}
          <div className="flex mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-center font-medium transition-colors border-b-2 ${
                isLogin
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-center font-medium transition-colors border-b-2 ${
                !isLogin
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Registrati
            </button>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="+39 123 456 7890"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimo 8 caratteri, almeno una lettera maiuscola e un numero
                </p>
              )}
            </div>

            {/* Confirm password (register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Marketing consent (register only) */}
            {!isLogin && (
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  checked={formData.marketingConsent}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600">
                  Desidero ricevere offerte esclusive e novità via email
                </span>
              </label>
            )}

            {/* Forgot password (login only) */}
            {isLogin && (
              <div className="text-right">
                <Link
                  href="/account/password-dimenticata"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Password dimenticata?
                </Link>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'Accedi'
              ) : (
                'Registrati'
              )}
            </Button>
          </form>

          {/* Terms (register only) */}
          {!isLogin && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              Registrandoti accetti i nostri{' '}
              <Link href="/termini" className="underline">
                Termini e Condizioni
              </Link>{' '}
              e la{' '}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
