/**
 * API Registrazione Cliente
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { generateRandomToken, getExpirationDate } from '@/lib/auth/jwt';
import { validateRegistration } from '@/lib/auth/validation';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, marketingConsent } = body;

    // 1. Validazione dati base
    const validation = validateRegistration({ email, password, firstName, lastName, phone });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // 2. Validazione requisiti password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, errors: { password: passwordValidation.errors.join('. ') } },
        { status: 400 }
      );
    }

    // 3. Verifica email non già registrata
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingCustomer) {
      // Se esiste ma non ha password (guest checkout precedente), aggiorna
      if (!existingCustomer.password) {
        const hashedPassword = await hashPassword(password);
        const verificationToken = generateRandomToken();
        const tokenExpires = getExpirationDate(AUTH_CONFIG.VERIFICATION_TOKEN_EXPIRES_HOURS);

        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            password: hashedPassword,
            firstName: firstName || existingCustomer.firstName,
            lastName: lastName || existingCustomer.lastName,
            phone: phone || existingCustomer.phone,
            verificationToken,
            tokenExpiresAt: tokenExpires,
            marketingConsent: marketingConsent || false,
            consentedAt: marketingConsent ? new Date() : null,
            fromWebsite: true,
            syncStatus: 'pending', // Da sincronizzare con MazGest
          },
        });

        // Invia email di verifica
        await sendVerificationEmail(
          email,
          firstName || existingCustomer.firstName || '',
          verificationToken
        );

        return NextResponse.json({
          success: true,
          message: 'Account aggiornato. Controlla la tua email per verificare l\'account.',
          requiresVerification: true,
        });
      }

      return NextResponse.json(
        { success: false, errors: { email: 'Email già registrata. Usa il login o recupera la password.' } },
        { status: 400 }
      );
    }

    // 4. Hash password
    const hashedPassword = await hashPassword(password);

    // 5. Genera token verifica email
    const verificationToken = generateRandomToken();
    const tokenExpires = getExpirationDate(AUTH_CONFIG.VERIFICATION_TOKEN_EXPIRES_HOURS);

    // 6. Crea nuovo cliente
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        verificationToken,
        tokenExpiresAt: tokenExpires,
        emailVerified: false,
        marketingConsent: marketingConsent || false,
        consentedAt: marketingConsent ? new Date() : null,
        fromWebsite: true,
        syncStatus: 'pending', // Da sincronizzare con MazGest
      },
    });

    // Invia email di verifica
    await sendVerificationEmail(
      customer.email,
      customer.firstName || '',
      verificationToken
    );

    return NextResponse.json({
      success: true,
      message: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
      requiresVerification: true,
      // Non restituiamo dati sensibili
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    });

  } catch (error) {
    console.error('❌ Errore registrazione:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante la registrazione. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
