/**
 * API Login Cliente
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRandomToken, getExpirationDateDays } from '@/lib/auth/jwt';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validazione input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e password obbligatorie' },
        { status: 400 }
      );
    }

    // 2. Trova cliente
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!customer || !customer.password) {
      // Messaggio generico per sicurezza
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // 3. Verifica password
    const isValidPassword = await verifyPassword(password, customer.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // 4. Verifica email verificata
    if (!customer.emailVerified) {
      return NextResponse.json({
        success: false,
        error: 'Email non verificata. Controlla la tua casella di posta.',
        requiresVerification: true,
        email: customer.email,
      }, { status: 403 });
    }

    // 5. Genera tokens
    const accessToken = generateAccessToken({
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName || undefined,
      lastName: customer.lastName || undefined,
    });

    const refreshToken = generateRandomToken();
    const refreshExpires = getExpirationDateDays(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_DAYS);

    // 6. Salva refresh token nel database
    await prisma.refreshToken.create({
      data: {
        customerId: customer.id,
        token: refreshToken,
        expiresAt: refreshExpires,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    });

    // 7. Aggiorna ultimo login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Imposta cookies httpOnly
    const cookieStore = await cookies();

    // Access token cookie (breve durata, per API)
    cookieStore.set(AUTH_CONFIG.COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minuti
      path: '/',
    });

    // Refresh token cookie (lunga durata)
    cookieStore.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60,
      path: '/',
    });

    console.log(`✅ Login: ${customer.email}`);

    return NextResponse.json({
      success: true,
      message: 'Login effettuato con successo',
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    });

  } catch (error) {
    console.error('❌ Errore login:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante il login. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
