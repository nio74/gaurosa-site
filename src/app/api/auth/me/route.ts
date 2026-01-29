/**
 * API Get Current User
 * GET /api/auth/me
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken, generateAccessToken, generateRandomToken, getExpirationDateDays } from '@/lib/auth/jwt';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;

    // 1. Prova con access token
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        const customer = await prisma.customer.findUnique({
          where: { id: payload.customerId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            billingAddress: true,
            billingCity: true,
            billingProvince: true,
            billingPostcode: true,
            billingCountry: true,
            shippingAddress: true,
            shippingCity: true,
            shippingProvince: true,
            shippingPostcode: true,
            shippingCountry: true,
            customerType: true,
            ragioneSociale: true,
            codiceFiscale: true,
            partitaIva: true,
            codiceSdi: true,
            pec: true,
            marketingConsent: true,
            createdAt: true,
          },
        });

        if (customer) {
          return NextResponse.json({
            success: true,
            customer,
          });
        }
      }
    }

    // 2. Access token scaduto, prova con refresh token
    if (refreshToken) {
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { customer: true },
      });

      // Verifica validità refresh token
      if (
        storedToken &&
        !storedToken.revokedAt &&
        new Date() < storedToken.expiresAt
      ) {
        const customer = storedToken.customer;

        // Genera nuovo access token
        const newAccessToken = generateAccessToken({
          customerId: customer.id,
          email: customer.email,
          firstName: customer.firstName || undefined,
          lastName: customer.lastName || undefined,
        });

        // Imposta nuovo access token cookie
        cookieStore.set(AUTH_CONFIG.COOKIE_NAME, newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60, // 15 minuti
          path: '/',
        });

        return NextResponse.json({
          success: true,
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            billingAddress: customer.billingAddress,
            billingCity: customer.billingCity,
            billingProvince: customer.billingProvince,
            billingPostcode: customer.billingPostcode,
            billingCountry: customer.billingCountry,
            shippingAddress: customer.shippingAddress,
            shippingCity: customer.shippingCity,
            shippingProvince: customer.shippingProvince,
            shippingPostcode: customer.shippingPostcode,
            shippingCountry: customer.shippingCountry,
            customerType: customer.customerType,
            ragioneSociale: customer.ragioneSociale,
            codiceFiscale: customer.codiceFiscale,
            partitaIva: customer.partitaIva,
            codiceSdi: customer.codiceSdi,
            pec: customer.pec,
            marketingConsent: customer.marketingConsent,
            createdAt: customer.createdAt,
          },
        });
      }
    }

    // 3. Nessun token valido
    return NextResponse.json(
      { success: false, error: 'Non autenticato' },
      { status: 401 }
    );

  } catch (error) {
    console.error('❌ Errore get user:', error);
    return NextResponse.json(
      { success: false, error: 'Errore del server' },
      { status: 500 }
    );
  }
}
