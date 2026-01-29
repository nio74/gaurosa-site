/**
 * API Batch Delete Products
 * DELETE /api/sync/products/batch-delete - Rimuove prodotti multipli per mazgestId
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Verifica API key
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.MAZGEST_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'API key non valida' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product_ids } = body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'product_ids richiesto (array)' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Batch delete ${product_ids.length} prodotti da gaurosa.it`);

    // Trova i prodotti per mazgestId
    const products = await prisma.product.findMany({
      where: {
        mazgestId: { in: product_ids.map((id: number) => Number(id)) },
      },
      select: { id: true, code: true },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        data: { deleted: 0, message: 'Nessun prodotto trovato da eliminare' },
      });
    }

    const productIds = products.map(p => p.id);

    // Elimina immagini associate
    await prisma.productImage.deleteMany({
      where: { productId: { in: productIds } },
    });

    // Elimina varianti associate
    await prisma.productVariant.deleteMany({
      where: { productId: { in: productIds } },
    });

    // Elimina i prodotti
    const deleteResult = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });

    console.log(`✅ Eliminati ${deleteResult.count} prodotti da gaurosa.it`);

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleteResult.count,
        codes: products.map(p => p.code),
      },
    });
  } catch (error) {
    console.error('Errore batch delete products:', error);
    return NextResponse.json(
      { success: false, error: 'Errore nella rimozione dei prodotti' },
      { status: 500 }
    );
  }
}
