/**
 * API Sync Categorie
 * Riceve categorie da MazGest e le salva nel database locale
 *
 * POST /api/sync/categories
 * Body: { categories: [...], api_key: "xxx" }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Helper per generare slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { categories, api_key } = body;

    // Verifica API key
    const validApiKey = process.env.MAZGEST_API_KEY || 'dev-api-key';
    if (api_key !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'API key non valida' },
        { status: 401 }
      );
    }

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: 'Formato dati non valido' },
        { status: 400 }
      );
    }

    console.log(`🔄 Sync: ricevute ${categories.length} categorie da MazGest`);

    let processed = 0;
    const errors: string[] = [];

    // Resetta contatori prodotti (verranno ricalcolati)
    await prisma.category.updateMany({
      data: { productCount: 0 },
    });

    let position = 0;
    for (const category of categories) {
      try {
        position++;
        const slug = generateSlug(category.name);

        // Upsert categoria principale
        const mainCat = await prisma.category.upsert({
          where: { slug },
          update: {
            name: category.name,
            productCount: category.count || 0,
            isActive: true,
            position,
          },
          create: {
            name: category.name,
            slug,
            productCount: category.count || 0,
            isActive: true,
            showInMenu: true,
            position,
          },
        });

        // Sync sottocategorie
        if (category.subcategories && category.subcategories.length > 0) {
          let subPosition = 0;
          for (const sub of category.subcategories) {
            subPosition++;
            const subSlug = `${slug}-${generateSlug(sub.name)}`;

            await prisma.category.upsert({
              where: { slug: subSlug },
              update: {
                name: sub.name,
                parentId: mainCat.id,
                productCount: sub.count || 0,
                isActive: true,
                position: subPosition,
              },
              create: {
                name: sub.name,
                slug: subSlug,
                parentId: mainCat.id,
                productCount: sub.count || 0,
                isActive: true,
                showInMenu: true,
                position: subPosition,
              },
            });
          }
        }

        processed++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Errore sconosciuto';
        errors.push(`Categoria ${category.name}: ${errorMsg}`);
        console.error(`❌ Errore sync categoria ${category.name}:`, err);
      }
    }

    // Disattiva categorie vuote (conteggio 0)
    await prisma.category.updateMany({
      where: { productCount: 0 },
      data: { isActive: false, showInMenu: false },
    });

    const durationMs = Date.now() - startTime;

    // Log sync
    await prisma.syncLog.create({
      data: {
        type: 'categories',
        direction: 'pull',
        status: errors.length === 0 ? 'success' : 'partial',
        itemsTotal: categories.length,
        itemsProcessed: processed,
        itemsFailed: errors.length,
        errorMessage: errors.length > 0 ? errors.join('\n') : null,
        completedAt: new Date(),
        durationMs,
      },
    });

    console.log(`✅ Sync categorie completato: ${processed}/${categories.length} (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        total: categories.length,
        processed,
        errors: errors.length > 0 ? errors : undefined,
        duration_ms: durationMs,
      },
    });
  } catch (error) {
    console.error('❌ Errore sync categorie:', error);

    await prisma.syncLog.create({
      data: {
        type: 'categories',
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

// GET per verificare stato sync categorie
export async function GET() {
  try {
    const lastSync = await prisma.syncLog.findFirst({
      where: { type: 'categories' },
      orderBy: { startedAt: 'desc' },
    });

    const categoryCount = await prisma.category.count({ where: { isActive: true } });
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { name: true, productCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        category_count: categoryCount,
        categories: categories.map((c) => ({ name: c.name, count: c.productCount })),
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
