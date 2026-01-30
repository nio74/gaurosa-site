import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/products
 * Lista prodotti dal database gaurosasite
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoria = searchParams.get('categoria') || '';
    const sottocategoria = searchParams.get('sottocategoria') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'newest';

    // Costruisci where clause
    const where: any = {
      isActive: true,
    };

    // Filtro categoria
    if (categoria) {
      where.OR = [
        { loadType: categoria },
        { mainCategory: categoria }
      ];
    }

    // Filtro sottocategoria
    if (sottocategoria) {
      where.subcategory = sottocategoria;
    }

    // Filtro ricerca
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ]
      };

      if (where.OR) {
        // Se c'è già un OR (categoria), usa AND
        where.AND = [searchCondition];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // Ordinamento
    let orderBy: any = { syncedAt: 'desc' };
    switch (sort) {
      case 'newest':
        orderBy = { syncedAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
    }

    const offset = (page - 1) * limit;

    // Query prodotti
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          variants: true,
          brand: true,
          supplier: true,
        }
      }),
      prisma.product.count({ where })
    ]);

    // Trasforma per il frontend
    const transformedProducts = products.map(p => ({
      code: p.code,
      ean: p.ean,
      name: p.name,
      description: p.description,
      load_type: p.loadType,
      macro_category: p.mainCategory,
      supplier: p.supplier?.name || '',
      price: Number(p.price),
      images: p.images.map(img => ({
        url: img.url,
        is_primary: img.isPrimary,
        position: img.sortOrder,
      })),
      stock: {
        total: p.stock,
        available: p.stock > 0,
      },
      variants: p.variants.map(v => ({
        sku: v.sku,
        size: v.attributeValue,
        price: v.price ? Number(v.price) : null,
        stock: v.stock,
      })),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          total,
          pages: totalPages,
          page,
          limit,
          offset,
          has_more: page < totalPages,
        }
      }
    });

  } catch (error: any) {
    console.error('Errore GET /api/products:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore recupero prodotti',
      message: error.message
    }, { status: 500 });
  }
}
