/**
 * Utilities per gestione password
 */

import * as bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from './config';

const SALT_ROUNDS = 12;

/**
 * Hash password con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Valida requisiti password
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`La password deve essere di almeno ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} caratteri`);
  }

  if (AUTH_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }

  if (AUTH_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }

  if (AUTH_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
