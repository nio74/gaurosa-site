/**
 * API Prodotti
 * GET /api/products - Lista prodotti con filtri
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parametri filtro
    const categoria = searchParams.get('categoria');
    const sottocategoria = searchParams.get('sottocategoria');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'newest';

    // Costruisci where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (categoria) {
      // loadType corrisponde alla categoria principale (orologi, gioielleria, etc.)
      where.loadType = categoria;
    }

    if (sottocategoria) {
      where.subcategory = sottocategoria;
    }

    if (brand) {
      where.brandId = parseInt(brand);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { code: { contains: search } },
      ];
    }

    // Ordinamento
    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Query prodotti
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          variants: true,
          brand: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Trasforma per il frontend
    const transformedProducts = products.map((p) => ({
      code: p.code,
      ean: p.ean,
      name: p.name,
      slug: p.slug,
      description: p.description,
      load_type: p.loadType,
      macro_category: p.mainCategory,
      supplier: p.brand?.name || null,
      price: Number(p.price),
      images: p.images.map((img) => ({
        url: img.url,
        is_primary: img.isPrimary,
        position: img.sortOrder,
      })),
      stock: {
        total: p.stock,
        available: p.stock > 0,
      },
      variants: p.variants.map((v) => ({
        sku: v.sku,
        size: v.attributeValue,
        price: Number(v.price || p.price),
        stock: v.stock,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Errore API prodotti:', error);
    return NextResponse.json(
      { success: false, error: 'Errore nel caricamento prodotti' },
      { status: 500 }
    );
  }
}
