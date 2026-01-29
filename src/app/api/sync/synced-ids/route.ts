/**
 * API Synced Product IDs
 * GET /api/sync/synced-ids - Restituisce gli ID MazGest dei prodotti sincronizzati
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API synced-ids chiamata');

    // Verifica API key
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.MAZGEST_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'API key non valida' },
        { status: 401 }
      );
    }

    console.log('🔍 Query prodotti sincronizzati...');

    // Ottieni tutti i mazgestId dei prodotti attivi
    // mazgestId è obbligatorio (Int, non Int?), quindi non serve filtrare per null
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        mazgestId: true,
      },
    });

    console.log(`✅ Trovati ${products.length} prodotti`);

    const syncedIds = products
      .map(p => p.mazgestId)
      .filter((id): id is number => id !== null);

    return NextResponse.json({
      success: true,
      data: {
        synced_ids: syncedIds,
        count: syncedIds.length,
      },
    });
  } catch (error) {
    console.error('❌ Errore API synced-ids:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { success: false, error: `Errore nel recupero prodotti sincronizzati: ${errorMessage}` },
      { status: 500 }
    );
  }
}
