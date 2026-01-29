/**
 * Configurazione Autenticazione
 */

export const AUTH_CONFIG = {
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: '15m', // Access token: 15 minuti
  REFRESH_TOKEN_EXPIRES_DAYS: 7, // Refresh token: 7 giorni

  // Email verification
  VERIFICATION_TOKEN_EXPIRES_HOURS: 24,

  // Password reset
  PASSWORD_RESET_EXPIRES_HOURS: 1,

  // Cookies
  COOKIE_NAME: 'gaurosa_auth',
  REFRESH_COOKIE_NAME: 'gaurosa_refresh',

  // Rate limiting (per IP)
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,

  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
};

// Regex per validazione
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_IT: /^(\+39)?[\s]?3[0-9]{8,9}$/,
  CODICE_FISCALE: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i,
  PARTITA_IVA: /^[0-9]{11}$/,
  CODICE_SDI: /^[A-Z0-9]{7}$/i,
};
