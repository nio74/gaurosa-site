/**
 * API Verifica Email
 * POST /api/auth/verify-email
 *
 * Dopo la verifica email, sincronizza automaticamente il cliente con MazGest
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncCustomerToMazGest } from '@/lib/mazgest/customerSync';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token mancante' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifica token ricevuto:', token);
    console.log('🔍 Lunghezza token:', token.length);

    // 1. Trova cliente con questo token
    const customer = await prisma.customer.findUnique({
      where: { verificationToken: token },
    });

    console.log('🔍 Cliente trovato:', customer ? `ID ${customer.id}, email: ${customer.email}` : 'NESSUNO');

    // Debug: cerca tutti i clienti per vedere i token
    const allCustomers = await prisma.customer.findMany({
      select: { id: true, email: true, verificationToken: true, emailVerified: true }
    });
    console.log('🔍 Tutti i clienti nel DB:', JSON.stringify(allCustomers, null, 2));

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Token non valido o già utilizzato' },
        { status: 400 }
      );
    }

    // 2. Verifica scadenza token
    if (customer.tokenExpiresAt && new Date() > customer.tokenExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Token scaduto. Richiedi un nuovo link di verifica.' },
        { status: 400 }
      );
    }

    // 3. Verifica se già verificato
    if (customer.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email già verificata. Puoi effettuare il login.',
        alreadyVerified: true,
      });
    }

    // 4. Aggiorna cliente come verificato
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null, // Invalida token
        tokenExpiresAt: null,
        syncStatus: 'syncing',
      },
    });

    console.log(`✅ Email verificata: ${customer.email}`);

    // 5. Invia email di benvenuto
    sendWelcomeEmail(updatedCustomer.email, updatedCustomer.firstName || '').catch((err) => {
      console.error('Errore invio email benvenuto:', err);
    });

    // 6. Sincronizza con MazGest (in background, non blocca la risposta)
    syncCustomerToMazGest({
      email: updatedCustomer.email,
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      phone: updatedCustomer.phone,
      customerType: (updatedCustomer.customerType as 'privato' | 'azienda') || 'privato',
      ragioneSociale: updatedCustomer.ragioneSociale,
      codiceFiscale: updatedCustomer.codiceFiscale,
      partitaIva: updatedCustomer.partitaIva,
      codiceSdi: updatedCustomer.codiceSdi,
      pec: updatedCustomer.pec,
      billingAddress: {
        address: updatedCustomer.billingAddress,
        city: updatedCustomer.billingCity,
        province: updatedCustomer.billingProvince,
        postcode: updatedCustomer.billingPostcode,
        country: updatedCustomer.billingCountry,
      },
      shippingAddress: {
        address: updatedCustomer.shippingAddress,
        city: updatedCustomer.shippingCity,
        province: updatedCustomer.shippingProvince,
        postcode: updatedCustomer.shippingPostcode,
        country: updatedCustomer.shippingCountry,
      },
      marketingConsent: updatedCustomer.marketingConsent,
      siteCustomerId: updatedCustomer.id,
    }).then(async (syncResult) => {
      // Aggiorna stato sync nel database
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          mazgestId: syncResult.mazgestId || null,
          syncedAt: syncResult.success ? new Date() : null,
          syncStatus: syncResult.success ? 'synced' : 'error',
          lastSyncError: syncResult.error || null,
        },
      });
    }).catch((err) => {
      console.error('Errore sync MazGest post-verifica:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Email verificata con successo! Ora puoi effettuare il login.',
    });

  } catch (error) {
    console.error('❌ Errore verifica email:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante la verifica. Riprova più tardi.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Verifica via link (per click da email)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    // Redirect alla pagina di errore
    return NextResponse.redirect(new URL('/auth/verify-error?reason=missing_token', request.url));
  }

  try {
    // Trova cliente
    const customer = await prisma.customer.findUnique({
      where: { verificationToken: token },
    });

    if (!customer) {
      return NextResponse.redirect(new URL('/auth/verify-error?reason=invalid_token', request.url));
    }

    if (customer.tokenExpiresAt && new Date() > customer.tokenExpiresAt) {
      return NextResponse.redirect(new URL('/auth/verify-error?reason=expired_token', request.url));
    }

    if (customer.emailVerified) {
      return NextResponse.redirect(new URL('/auth/verify-success?already=true', request.url));
    }

    // Verifica email
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        tokenExpiresAt: null,
        syncStatus: 'syncing',
      },
    });

    console.log(`✅ Email verificata via link: ${customer.email}`);

    // Invia email di benvenuto
    sendWelcomeEmail(updatedCustomer.email, updatedCustomer.firstName || '').catch((err) => {
      console.error('Errore invio email benvenuto:', err);
    });

    // Sincronizza con MazGest (in background)
    syncCustomerToMazGest({
      email: updatedCustomer.email,
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      phone: updatedCustomer.phone,
      customerType: (updatedCustomer.customerType as 'privato' | 'azienda') || 'privato',
      ragioneSociale: updatedCustomer.ragioneSociale,
      codiceFiscale: updatedCustomer.codiceFiscale,
      partitaIva: updatedCustomer.partitaIva,
      codiceSdi: updatedCustomer.codiceSdi,
      pec: updatedCustomer.pec,
      billingAddress: {
        address: updatedCustomer.billingAddress,
        city: updatedCustomer.billingCity,
        province: updatedCustomer.billingProvince,
        postcode: updatedCustomer.billingPostcode,
        country: updatedCustomer.billingCountry,
      },
      marketingConsent: updatedCustomer.marketingConsent,
      siteCustomerId: updatedCustomer.id,
    }).then(async (syncResult) => {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          mazgestId: syncResult.mazgestId || null,
          syncedAt: syncResult.success ? new Date() : null,
          syncStatus: syncResult.success ? 'synced' : 'error',
          lastSyncError: syncResult.error || null,
        },
      });
    }).catch((err) => {
      console.error('Errore sync MazGest post-verifica:', err);
    });

    return NextResponse.redirect(new URL('/auth/verify-success', request.url));

  } catch (error) {
    console.error('❌ Errore verifica via link:', error);
    return NextResponse.redirect(new URL('/auth/verify-error?reason=server_error', request.url));
  }
}
