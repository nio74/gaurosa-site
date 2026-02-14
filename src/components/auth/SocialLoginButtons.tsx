'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// API base URL for PHP auth endpoints
// In dev: Next.js proxy rewrites /api/* -> http://localhost/gaurosa-site/api/*
// In prod: .htaccess routes /api/* to PHP files directly
const AUTH_API_BASE = '/api/api/auth';

// Google Client ID from env
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface SocialLoginButtonsProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

// Extend Window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function SocialLoginButtons({ onSuccess, onError }: SocialLoginButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Handle Google credential response
  const handleGoogleCallback = useCallback(async (response: any) => {
    if (!response.credential) {
      onError?.('Risposta Google non valida');
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await fetch(`${AUTH_API_BASE}/google.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.(data.user);
      } else {
        onError?.(data.error || 'Errore durante l\'accesso con Google');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      onError?.('Errore di connessione. Riprova.');
    } finally {
      setGoogleLoading(false);
    }
  }, [onSuccess, onError]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Check if already loaded
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount (it's cached)
    };
  }, []);

  // Initialize Google button when ready
  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the Google-styled button
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: googleButtonRef.current.offsetWidth,
        locale: 'it',
      });
    }
  }, [googleReady, handleGoogleCallback]);

  // Don't render if Google not configured
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {googleLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        )}
        {/* Google renders its own button here */}
        <div ref={googleButtonRef} className="w-full flex justify-center" />
        {/* Fallback while Google script loads */}
        {!googleReady && (
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-500 text-sm font-medium opacity-50"
          >
            <GoogleIcon />
            Caricamento...
          </button>
        )}
      </div>
    </div>
  );
}

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
