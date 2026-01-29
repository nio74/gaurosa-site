/**
 * JWT Utilities
 */

import * as jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from './config';

export interface JWTPayload {
  customerId: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Genera access token JWT
 */
export function generateAccessToken(payload: JWTPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, AUTH_CONFIG.JWT_SECRET, {
    expiresIn: '15m', // 15 minuti
  });
}

/**
 * Verifica e decodifica access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Genera token casuale (per verifica email, reset password, refresh token)
 */
export function generateRandomToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcola data scadenza
 */
export function getExpirationDate(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Calcola data scadenza in giorni
 */
export function getExpirationDateDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
