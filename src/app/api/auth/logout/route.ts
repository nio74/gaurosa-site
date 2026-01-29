/**
 * API Logout Cliente
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;

    // Revoca refresh token nel database se presente
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    // Rimuovi cookies
    cookieStore.delete(AUTH_CONFIG.COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.REFRESH_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logout effettuato con successo',
    });

  } catch (error) {
    console.error('❌ Errore logout:', error);
    // Anche in caso di errore, proviamo a rimuovere i cookies
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_CONFIG.COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.REFRESH_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logout effettuato',
    });
  }
}
