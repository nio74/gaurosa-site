import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
};

export async function GET(request: NextRequest) {
  try {
    // Get all mazgestId from products table
    // mazgestId is required (Int not nullable), so all products have one
    const products = await prisma.product.findMany({
      select: {
        mazgestId: true
      }
    });

    const syncedIds = products.map(p => p.mazgestId);

    return NextResponse.json({
      success: true,
      data: {
        synced_ids: syncedIds,
        count: syncedIds.length
      }
    }, { headers });

  } catch (error: any) {
    console.error('Errore synced-ids:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore database: ' + error.message
    }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}
