/**
 * API Categorie
 * GET /api/categories - Lista categorie per il menu e filtri
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Ottieni categorie attive dal database
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    // Organizza in struttura gerarchica
    const mainCategories: Record<number, {
      id: number;
      name: string;
      slug: string;
      productCount: number;
      showInMenu: boolean;
      position: number;
      imageUrl: string | null;
      subcategories: Array<{
        id: number;
        name: string;
        slug: string;
        productCount: number;
      }>;
    }> = {};

    const subcategories: typeof categories = [];

    for (const cat of categories) {
      if (cat.parentId === null) {
        mainCategories[cat.id] = {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat.productCount,
          showInMenu: cat.showInMenu,
          position: cat.position,
          imageUrl: cat.imageUrl,
          subcategories: [],
        };
      } else {
        subcategories.push(cat);
      }
    }

    // Aggiungi sottocategorie ai parent
    for (const sub of subcategories) {
      if (sub.parentId && mainCategories[sub.parentId]) {
        mainCategories[sub.parentId].subcategories.push({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          productCount: sub.productCount,
        });
      }
    }

    // Filtra solo quelle da mostrare nel menu
    const menuCategories = Object.values(mainCategories)
      .filter((c) => c.showInMenu)
      .sort((a, b) => a.position - b.position);

    return NextResponse.json({
      success: true,
      data: {
        categories: menuCategories,
        total: menuCategories.length,
      },
    });
  } catch (error) {
    console.error('Errore API categorie:', error);

    // Fallback con categorie statiche se il database fallisce
    const fallbackCategories = [
      { id: 1, name: 'Gioielli', slug: 'gioielleria', productCount: 0, showInMenu: true, position: 1, imageUrl: null, subcategories: [] },
      { id: 2, name: 'Orologi', slug: 'orologi', productCount: 0, showInMenu: true, position: 2, imageUrl: null, subcategories: [] },
      { id: 3, name: 'Accessori', slug: 'accessori', productCount: 0, showInMenu: true, position: 3, imageUrl: null, subcategories: [] },
    ];

    return NextResponse.json({
      success: true,
      data: {
        categories: fallbackCategories,
        total: fallbackCategories.length,
      },
    });
  }
}
