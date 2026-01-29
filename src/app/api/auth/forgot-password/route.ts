/**
 * API Richiesta Reset Password
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateRandomToken, getExpirationDate } from '@/lib/auth/jwt';
import { validateEmail } from '@/lib/auth/validation';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validazione email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email non valida' },
        { status: 400 }
      );
    }

    // 2. Trova cliente (messaggio generico per sicurezza)
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Rispondiamo sempre con successo per non rivelare se l'email esiste
    const successResponse = {
      success: true,
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset della password.',
    };

    if (!customer || !customer.password) {
      // Email non esiste o è un guest checkout - rispondiamo comunque con successo
      console.log(`⚠️ Reset password richiesto per email non esistente: ${email}`);
      return NextResponse.json(successResponse);
    }

    // 3. Genera token reset password
    const resetToken = generateRandomToken();
    const tokenExpires = getExpirationDate(AUTH_CONFIG.PASSWORD_RESET_EXPIRES_HOURS);

    // 4. Salva token nel database
    await prisma.passwordReset.create({
      data: {
        customerId: customer.id,
        token: resetToken,
        expiresAt: tokenExpires,
      },
    });

    // Invia email con link reset password
    await sendPasswordResetEmail(
      customer.email,
      customer.firstName || '',
      resetToken
    );

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('❌ Errore forgot password:', error);
    return NextResponse.json(
      { success: false, error: 'Errore del server. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
