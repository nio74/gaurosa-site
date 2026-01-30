import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SYNC_API_KEY = process.env.SYNC_API_KEY || 'gaurosa_prod_2026_secure_key_change_me';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
};

export async function DELETE(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== SYNC_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'API key non valida'
    }, { status: 401, headers });
  }

  // Get product ID from query params
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');

  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'ID prodotto richiesto'
    }, { status: 400, headers });
  }

  try {
    // Find product by mazgestId
    const product = await prisma.product.findUnique({
      where: { mazgestId: parseInt(productId) }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Prodotto non trovato'
      }, { status: 404, headers });
    }

    // Delete product (cascade will handle images and variants)
    await prisma.product.delete({
      where: { id: product.id }
    });

    return NextResponse.json({
      success: true,
      message: `Prodotto #${productId} eliminato`
    }, { headers });

  } catch (error: any) {
    console.error('Errore delete:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore database: ' + error.message
    }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}
