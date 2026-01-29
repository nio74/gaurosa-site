/**
 * API Singolo Prodotto
 * GET /api/products/[slug] - Dettaglio prodotto per slug o codice
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Cerca per slug o per codice
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { code: slug },
        ],
        isActive: true,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        brand: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Prodotto non trovato' },
        { status: 404 }
      );
    }

    // Trasforma per il frontend
    const transformedProduct = {
      code: product.code,
      ean: product.ean,
      name: product.name,
      slug: product.slug,
      description: product.description || product.descriptionIt,
      load_type: product.loadType,
      macro_category: product.mainCategory,
      supplier: product.brand?.name || null,
      price: Number(product.price),
      images: product.images.map((img) => ({
        url: img.url,
        is_primary: img.isPrimary,
        position: img.sortOrder,
      })),
      stock: {
        total: product.stock,
        available: product.stock > 0,
      },
      variants: product.variants.map((v) => ({
        sku: v.sku,
        size: v.attributeValue,
        price: Number(v.price || product.price),
        stock: v.stock,
      })),
      // Extra info
      material: product.materialPrimary,
      gender: product.watchGender,
      seo: {
        title: product.seoTitle,
        description: product.seoDescription,
      },
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error('Errore API prodotto:', error);
    return NextResponse.json(
      { success: false, error: 'Errore nel caricamento del prodotto' },
      { status: 500 }
    );
  }
}
