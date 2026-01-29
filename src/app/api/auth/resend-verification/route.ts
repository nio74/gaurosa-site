/**
 * API Reinvia Email Verifica
 * POST /api/auth/resend-verification
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateRandomToken, getExpirationDate } from '@/lib/auth/jwt';
import { validateEmail } from '@/lib/auth/validation';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { sendVerificationEmail } from '@/lib/email';

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

    // 2. Trova cliente
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Rispondiamo sempre con successo per sicurezza
    const successResponse = {
      success: true,
      message: 'Se l\'account esiste e non è verificato, riceverai una nuova email di verifica.',
    };

    if (!customer || !customer.password) {
      console.log(`⚠️ Resend verification per email non esistente: ${email}`);
      return NextResponse.json(successResponse);
    }

    // 3. Verifica se già verificato
    if (customer.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Il tuo account è già verificato. Puoi effettuare il login.',
        alreadyVerified: true,
      });
    }

    // 4. Genera nuovo token
    const verificationToken = generateRandomToken();
    const tokenExpires = getExpirationDate(AUTH_CONFIG.VERIFICATION_TOKEN_EXPIRES_HOURS);

    // 5. Aggiorna token
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        verificationToken,
        tokenExpiresAt: tokenExpires,
      },
    });

    // Invia email di verifica
    await sendVerificationEmail(
      customer.email,
      customer.firstName || '',
      verificationToken
    );

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('❌ Errore resend verification:', error);
    return NextResponse.json(
      { success: false, error: 'Errore del server. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
