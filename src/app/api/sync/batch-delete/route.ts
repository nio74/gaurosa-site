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

  // Get product IDs from body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Body JSON non valido'
    }, { status: 400, headers });
  }

  const productIds = body.product_ids;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'product_ids richiesto (array)'
    }, { status: 400, headers });
  }

  try {
    let deleted = 0;
    const errors: string[] = [];

    for (const mazgestId of productIds) {
      try {
        // Find product
        const product = await prisma.product.findUnique({
          where: { mazgestId: parseInt(mazgestId) }
        });

        if (!product) {
          continue; // Product doesn't exist, skip
        }

        // Delete product (cascade handles images and variants)
        await prisma.product.delete({
          where: { id: product.id }
        });

        deleted++;

      } catch (err: any) {
        errors.push(`Prodotto #${mazgestId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requested: productIds.length,
        deleted,
        errors: errors.length > 0 ? errors : null
      }
    }, { headers });

  } catch (error: any) {
    console.error('Errore batch-delete:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore database: ' + error.message
    }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}
