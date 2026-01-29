/**
 * API Sync Prodotti
 * Riceve prodotti da MazGest e li salva nel database locale
 *
 * POST /api/sync/products
 * Body: { products: [...], api_key: "xxx" }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Helper per generare slug
function generateSlug(name: string, code: string): string {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${code.toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { products, api_key } = body;

    // Verifica API key
    const validApiKey = process.env.MAZGEST_API_KEY || 'dev-api-key';
    if (api_key !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'API key non valida' },
        { status: 401 }
      );
    }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Formato dati non valido' },
        { status: 400 }
      );
    }

    console.log(`🔄 Sync: ricevuti ${products.length} prodotti da MazGest`);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // Upsert prodotto (usa nomi campi corretti da schema Prisma)
        await prisma.product.upsert({
          where: { mazgestId: product.id },
          update: {
            code: product.code,
            ean: product.ean_code || null,
            name: product.name,
            slug: generateSlug(product.name, product.code),
            description: product.description || null,
            loadType: product.load_type || null,
            mainCategory: product.main_category || product.macro_category || null,
            subcategory: product.subcategory || product.sub_category || null,
            price: product.public_price || 0,
            compareAtPrice: product.compare_at_price || null,
            stock: product.stock || 0,
            stockStatus: product.status || 'in_stock',
            // Attributi materiale
            materialPrimary: product.material_primary || product.material || null,
            materialColor: product.material_color || null,
            // Attributi orologi
            watchGender: product.watch_gender || product.gender || null,
            // SEO
            seoTitle: product.seo_title || null,
            seoDescription: product.seo_description || null,
            descriptionIt: product.description_it || null,
            descriptionEn: product.description_en || null,
            isActive: product.status === 'in_stock',
            isFeatured: product.is_featured || false,
            syncedAt: new Date(),
          },
          create: {
            mazgestId: product.id,
            code: product.code,
            ean: product.ean_code || null,
            name: product.name,
            slug: generateSlug(product.name, product.code),
            description: product.description || null,
            loadType: product.load_type || null,
            mainCategory: product.main_category || product.macro_category || null,
            subcategory: product.subcategory || product.sub_category || null,
            price: product.public_price || 0,
            compareAtPrice: product.compare_at_price || null,
            stock: product.stock || 0,
            stockStatus: product.status || 'in_stock',
            // Attributi materiale
            materialPrimary: product.material_primary || product.material || null,
            materialColor: product.material_color || null,
            // Attributi orologi
            watchGender: product.watch_gender || product.gender || null,
            // SEO
            seoTitle: product.seo_title || null,
            seoDescription: product.seo_description || null,
            descriptionIt: product.description_it || null,
            descriptionEn: product.description_en || null,
            isActive: product.status === 'in_stock',
            isFeatured: product.is_featured || false,
            syncedAt: new Date(),
          },
        });

        // Sync immagini
        if (product.images && product.images.length > 0) {
          // Trova il prodotto appena creato/aggiornato
          const dbProduct = await prisma.product.findUnique({
            where: { mazgestId: product.id },
          });

          if (dbProduct) {
            // Elimina immagini esistenti
            await prisma.productImage.deleteMany({
              where: { productId: dbProduct.id },
            });

            // Inserisci nuove immagini
            for (const img of product.images) {
              await prisma.productImage.create({
                data: {
                  productId: dbProduct.id,
                  url: img.url.startsWith('http') ? img.url : `https://api.mazgest.org${img.url}`,
                  isPrimary: img.is_primary || false,
                  sortOrder: img.sort_order || 0,
                },
              });
            }
          }
        }

        // Sync varianti
        if (product.variants && product.variants.length > 0) {
          const dbProduct = await prisma.product.findUnique({
            where: { mazgestId: product.id },
          });

          if (dbProduct) {
            // Elimina varianti esistenti
            await prisma.productVariant.deleteMany({
              where: { productId: dbProduct.id },
            });

            // Inserisci nuove varianti
            for (const variant of product.variants) {
              await prisma.productVariant.create({
                data: {
                  productId: dbProduct.id,
                  mazgestVariantId: variant.id || null,
                  sku: variant.sku || null,
                  name: variant.name || null,
                  attributeName: variant.attribute_name || null,
                  attributeValue: variant.attribute_value || null,
                  isVirtual: variant.is_virtual || false,
                  parentVariantId: variant.parent_variant_id || null,
                  price: variant.price || null,
                  stock: variant.stock || 0,
                },
              });
            }
          }
        }

        processed++;
      } catch (err) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : 'Errore sconosciuto';
        errors.push(`Prodotto ${product.code}: ${errorMsg}`);
        console.error(`❌ Errore sync prodotto ${product.code}:`, err);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log sync
    await prisma.syncLog.create({
      data: {
        type: 'products',
        direction: 'pull',
        status: failed === 0 ? 'success' : failed < products.length ? 'partial' : 'error',
        itemsTotal: products.length,
        itemsProcessed: processed,
        itemsFailed: failed,
        errorMessage: errors.length > 0 ? errors.join('\n') : null,
        completedAt: new Date(),
        durationMs,
      },
    });

    console.log(`✅ Sync completato: ${processed}/${products.length} prodotti (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        total: products.length,
        processed,
        failed,
        duration_ms: durationMs,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

  } catch (error) {
    console.error('❌ Errore sync prodotti:', error);

    // Log errore
    await prisma.syncLog.create({
      data: {
        type: 'products',
        direction: 'pull',
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Errore sconosciuto',
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore interno',
      },
      { status: 500 }
    );
  }
}

// GET per verificare stato sync
export async function GET() {
  try {
    const lastSync = await prisma.syncLog.findFirst({
      where: { type: 'products' },
      orderBy: { startedAt: 'desc' },
    });

    const productCount = await prisma.product.count();

    return NextResponse.json({
      success: true,
      data: {
        product_count: productCount,
        last_sync: lastSync
          ? {
              status: lastSync.status,
              items_processed: lastSync.itemsProcessed,
              completed_at: lastSync.completedAt,
              duration_ms: lastSync.durationMs,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore lettura stato sync' },
      { status: 500 }
    );
  }
}
