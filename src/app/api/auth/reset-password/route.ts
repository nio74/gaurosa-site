/**
 * API Reset Password
 * POST /api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // 1. Validazione input
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token mancante' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password mancante' },
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

    // 3. Trova token valido
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { customer: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: 'Token non valido o già utilizzato' },
        { status: 400 }
      );
    }

    // 4. Verifica scadenza
    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Token scaduto. Richiedi un nuovo link di reset.' },
        { status: 400 }
      );
    }

    // 5. Verifica se già utilizzato
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Token già utilizzato. Richiedi un nuovo link di reset.' },
        { status: 400 }
      );
    }

    // 6. Hash nuova password
    const hashedPassword = await hashPassword(password);

    // 7. Aggiorna password e marca token come usato (transazione)
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: resetRecord.customerId },
        data: {
          password: hashedPassword,
          syncStatus: 'pending', // Da risincronizzare con MazGest
        },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoca tutti i refresh token esistenti (force logout everywhere)
      prisma.refreshToken.updateMany({
        where: { customerId: resetRecord.customerId },
        data: { revokedAt: new Date() },
      }),
    ]);

    console.log(`✅ Password resettata per: ${resetRecord.customer.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password aggiornata con successo. Ora puoi effettuare il login.',
    });

  } catch (error) {
    console.error('❌ Errore reset password:', error);
    return NextResponse.json(
      { success: false, error: 'Errore del server. Riprova più tardi.' },
      { status: 500 }
    );
  }
}
