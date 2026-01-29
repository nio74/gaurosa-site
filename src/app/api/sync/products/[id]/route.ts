/**
 * API Sync Single Product
 * DELETE /api/sync/products/[id] - Rimuove prodotto dal sito (per mazgestId)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const mazgestId = parseInt(id);

    if (isNaN(mazgestId)) {
      return NextResponse.json(
        { success: false, error: 'ID non valido' },
        { status: 400 }
      );
    }

    // Trova il prodotto per mazgestId
    const product = await prisma.product.findFirst({
      where: { mazgestId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Prodotto non trovato' },
        { status: 404 }
      );
    }

    // Elimina immagini associate
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    // Elimina varianti associate
    await prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });

    // Elimina il prodotto
    await prisma.product.delete({
      where: { id: product.id },
    });

    console.log(`🗑️ Prodotto mazgestId=${mazgestId} rimosso da gaurosa.it`);

    return NextResponse.json({
      success: true,
      message: `Prodotto ${product.code} rimosso`,
    });
  } catch (error) {
    console.error('Errore DELETE sync product:', error);
    return NextResponse.json(
      { success: false, error: 'Errore nella rimozione del prodotto' },
      { status: 500 }
    );
  }
}
