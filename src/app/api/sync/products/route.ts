import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const SYNC_API_KEY = process.env.SYNC_API_KEY || 'gaurosa_prod_2026_secure_key_change_me';

// URL base MazGest per scaricare immagini
const MAZGEST_URL = process.env.MAZGEST_IMAGES_URL || 'http://localhost:5000';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
};

// Helper per generare slug unico
function generateSlug(name: string, code: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${baseSlug}-${code.toLowerCase()}`;
}

// Helper per scaricare e salvare immagine
async function downloadAndSaveImage(
  imageUrl: string,
  productCode: string,
  index: number
): Promise<string | null> {
  try {
    // Costruisci URL completo se relativo
    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${MAZGEST_URL}${imageUrl}`;

    console.log(`Downloading image: ${fullUrl}`);

    // Scarica immagine
    const response = await fetch(fullUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();

    // Estrai estensione dal URL originale
    const urlPath = imageUrl.split('?')[0];
    const ext = path.extname(urlPath) || '.jpg';

    // Crea cartella prodotto se non esiste
    const productDir = path.join(process.cwd(), 'public', 'uploads', 'products', productCode);
    if (!existsSync(productDir)) {
      await mkdir(productDir, { recursive: true });
    }

    // Nome file: img-{index}{ext}
    const fileName = `img-${index}${ext}`;
    const filePath = path.join(productDir, fileName);

    // Salva file
    await writeFile(filePath, Buffer.from(buffer));

    // Ritorna URL relativo per il sito
    const localUrl = `/uploads/products/${productCode}/${fileName}`;
    console.log(`Image saved: ${localUrl}`);

    return localUrl;

  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Verify API key (from header or body)
  const apiKeyHeader = request.headers.get('x-api-key');

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Body JSON non valido'
    }, { status: 400, headers });
  }

  const apiKey = apiKeyHeader || body.api_key;

  if (apiKey !== SYNC_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'API key non valida'
    }, { status: 401, headers });
  }

  const products = body.products;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'products richiesto (array)'
    }, { status: 400, headers });
  }

  let processed = 0;
  let failed = 0;
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      // Genera slug unico
      const slug = generateSlug(product.name || 'prodotto', product.code);

      // Trova o crea brand se presente
      let brandId = null;
      if (product.brand_name) {
        const brand = await prisma.brand.upsert({
          where: { slug: product.brand_name.toLowerCase().replace(/\s+/g, '-') },
          update: { name: product.brand_name },
          create: {
            name: product.brand_name,
            slug: product.brand_name.toLowerCase().replace(/\s+/g, '-'),
            mazgestId: product.brand_id,
          },
        });
        brandId = brand.id;
      }

      // Trova o crea supplier se presente
      let supplierId = null;
      if (product.supplier_name) {
        const supplier = await prisma.supplier.upsert({
          where: { slug: product.supplier_name.toLowerCase().replace(/\s+/g, '-') },
          update: { name: product.supplier_name },
          create: {
            name: product.supplier_name,
            slug: product.supplier_name.toLowerCase().replace(/\s+/g, '-'),
            mazgestId: product.supplier_id,
          },
        });
        supplierId = supplier.id;
      }

      // Upsert prodotto
      const savedProduct = await prisma.product.upsert({
        where: { mazgestId: product.id },
        update: {
          code: product.code,
          ean: product.ean_code,
          name: product.name,
          slug: slug,
          description: product.description,
          loadType: product.load_type,
          mainCategory: product.main_category,
          subcategory: product.subcategory,
          brandId: brandId,
          supplierId: supplierId,
          price: product.public_price || 0,
          stock: product.stock || 0,
          stockStatus: product.stock > 0 ? 'in_stock' : 'out_of_stock',
          // Materiali
          materialPrimary: product.material_primary,
          materialColor: product.material_color,
          materialWeightGrams: product.material_weight_grams,
          // Pietre
          stoneMainType: product.stone_main_type,
          stoneMainCarats: product.stone_main_carats,
          stoneMainColor: product.stone_main_color,
          stoneMainClarity: product.stone_main_clarity,
          stoneMainCut: product.stone_main_cut,
          stoneMainCertificate: product.stone_main_certificate,
          stonesSecondaryType: product.stones_secondary_type,
          stonesSecondaryCount: product.stones_secondary_count,
          // Perle
          pearlType: product.pearl_type,
          pearlSizeMm: product.pearl_size_mm,
          pearlColor: product.pearl_color,
          // Misure
          sizeRingIt: product.size_ring_it,
          sizeBraceletCm: product.size_bracelet_cm,
          sizeNecklaceCm: product.size_necklace_cm,
          sizeEarringMm: product.size_earring_mm,
          // Tipi specifici
          ringType: product.ring_type,
          ringStyle: product.ring_style,
          earringType: product.earring_type,
          braceletType: product.bracelet_type,
          necklaceType: product.necklace_type,
          pendantType: product.pendant_type,
          // Orologi
          watchGender: product.watch_gender,
          watchType: product.watch_type,
          watchMovement: product.watch_movement,
          // Condizione
          itemCondition: product.item_condition || 'nuovo',
          // SEO
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          descriptionIt: product.description_it,
          descriptionEn: product.description_en,
          // Sync
          syncedAt: new Date(),
          isActive: true,
        },
        create: {
          mazgestId: product.id,
          code: product.code,
          ean: product.ean_code,
          name: product.name,
          slug: slug,
          description: product.description,
          loadType: product.load_type,
          mainCategory: product.main_category,
          subcategory: product.subcategory,
          brandId: brandId,
          supplierId: supplierId,
          price: product.public_price || 0,
          stock: product.stock || 0,
          stockStatus: product.stock > 0 ? 'in_stock' : 'out_of_stock',
          // Materiali
          materialPrimary: product.material_primary,
          materialColor: product.material_color,
          materialWeightGrams: product.material_weight_grams,
          // Pietre
          stoneMainType: product.stone_main_type,
          stoneMainCarats: product.stone_main_carats,
          stoneMainColor: product.stone_main_color,
          stoneMainClarity: product.stone_main_clarity,
          stoneMainCut: product.stone_main_cut,
          stoneMainCertificate: product.stone_main_certificate,
          stonesSecondaryType: product.stones_secondary_type,
          stonesSecondaryCount: product.stones_secondary_count,
          // Perle
          pearlType: product.pearl_type,
          pearlSizeMm: product.pearl_size_mm,
          pearlColor: product.pearl_color,
          // Misure
          sizeRingIt: product.size_ring_it,
          sizeBraceletCm: product.size_bracelet_cm,
          sizeNecklaceCm: product.size_necklace_cm,
          sizeEarringMm: product.size_earring_mm,
          // Tipi specifici
          ringType: product.ring_type,
          ringStyle: product.ring_style,
          earringType: product.earring_type,
          braceletType: product.bracelet_type,
          necklaceType: product.necklace_type,
          pendantType: product.pendant_type,
          // Orologi
          watchGender: product.watch_gender,
          watchType: product.watch_type,
          watchMovement: product.watch_movement,
          // Condizione
          itemCondition: product.item_condition || 'nuovo',
          // SEO
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          descriptionIt: product.description_it,
          descriptionEn: product.description_en,
          // Sync
          syncedAt: new Date(),
          isActive: true,
        },
      });

      // Sync immagini - SCARICA E SALVA LOCALMENTE
      if (product.images && product.images.length > 0) {
        // Elimina immagini esistenti dal DB
        await prisma.productImage.deleteMany({
          where: { productId: savedProduct.id }
        });

        // Scarica e salva ogni immagine
        for (let i = 0; i < product.images.length; i++) {
          const img = product.images[i];

          // Scarica immagine da MazGest e salva localmente
          const localUrl = await downloadAndSaveImage(
            img.url,
            product.code,
            i + 1
          );

          if (localUrl) {
            // Salva nel DB con URL locale
            await prisma.productImage.create({
              data: {
                productId: savedProduct.id,
                url: localUrl,
                isPrimary: img.is_primary || (i === 0),
                sortOrder: img.sort_order || i,
              },
            });
            imagesDownloaded++;
          } else {
            // Fallback: salva URL originale se download fallisce
            await prisma.productImage.create({
              data: {
                productId: savedProduct.id,
                url: img.url,
                isPrimary: img.is_primary || (i === 0),
                sortOrder: img.sort_order || i,
              },
            });
            imagesFailed++;
          }
        }
      }

      // Sync varianti
      if (product.variants && product.variants.length > 0) {
        // Elimina varianti esistenti
        await prisma.productVariant.deleteMany({
          where: { productId: savedProduct.id }
        });

        // Crea nuove varianti
        for (const variant of product.variants) {
          await prisma.productVariant.create({
            data: {
              productId: savedProduct.id,
              mazgestVariantId: variant.id,
              sku: variant.sku,
              name: variant.name,
              attributeName: variant.attribute_name,
              attributeValue: variant.attribute_value,
              isVirtual: variant.is_virtual || false,
              parentVariantId: variant.parent_variant_id,
              price: variant.price,
              stock: variant.stock || 0,
            },
          });
        }
      }

      processed++;

    } catch (err: any) {
      failed++;
      errors.push(`Prodotto ${product.code || product.id}: ${err.message}`);
      console.error(`Errore sync prodotto ${product.code}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      requested: products.length,
      processed,
      failed,
      images: {
        downloaded: imagesDownloaded,
        failed: imagesFailed
      },
      errors: errors.length > 0 ? errors : null
    }
  }, { headers });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}
