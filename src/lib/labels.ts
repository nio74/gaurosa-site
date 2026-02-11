/**
 * Traduzioni italiane per valori attributi prodotti
 * 
 * I valori nel database sono in formato codice (es: "oro_750", "diamante")
 * Questo file li traduce in label leggibili per l'utente
 */

// ============================================
// MATERIALI
// ============================================
const MATERIAL_LABELS: Record<string, string> = {
  // Oro
  oro_750: 'Oro 750\u2030 (18K)',
  oro_585: 'Oro 585\u2030 (14K)',
  oro_375: 'Oro 375\u2030 (9K)',
  oro_999: 'Oro 999\u2030 (24K)',
  oro_rosa: 'Oro Rosa',
  oro_bianco: 'Oro Bianco',
  // Argento
  argento_925: 'Argento 925\u2030',
  argento_800: 'Argento 800\u2030',
  argento_999: 'Argento Puro',
  // Platino
  platino_950: 'Platino 950\u2030',
  platino_900: 'Platino 900\u2030',
  // Altri
  acciaio: 'Acciaio',
  acciaio_inox: 'Acciaio Inox',
  titanio: 'Titanio',
  ceramica: 'Ceramica',
  bronzo: 'Bronzo',
  ottone: 'Ottone',
  rame: 'Rame',
  palladio: 'Palladio',
  rodio: 'Rodio',
  vermeil: 'Vermeil',
  placcato_oro: 'Placcato Oro',
  placcato_argento: 'Placcato Argento',
  pelle: 'Pelle',
  tessuto: 'Tessuto',
  caucciu: 'Caucciu',
  silicone: 'Silicone',
  legno: 'Legno',
  resina: 'Resina',
  vetro: 'Vetro di Murano',
  perla: 'Perla',
};

// ============================================
// COLORI MATERIALE
// ============================================
const MATERIAL_COLOR_LABELS: Record<string, string> = {
  giallo: 'Giallo',
  bianco: 'Bianco',
  rosa: 'Rosa',
  rosso: 'Rosso',
  verde: 'Verde',
  nero: 'Nero',
  blu: 'Blu',
  argento: 'Argento',
  bicolore: 'Bicolore',
  tricolore: 'Tricolore',
  champagne: 'Champagne',
  rodio: 'Rodio',
  brunito: 'Brunito',
  satinato: 'Satinato',
  lucido: 'Lucido',
  opaco: 'Opaco',
};

/** Hex color swatches for material colors */
export const COLOR_SWATCHES: Record<string, string> = {
  giallo: '#FFD700',
  bianco: '#F5F5F5',
  rosa: '#FFB6C1',
  rosso: '#DC143C',
  verde: '#228B22',
  nero: '#1a1a1a',
  blu: '#1E3A8A',
  argento: '#C0C0C0',
  bicolore: 'linear-gradient(135deg, #FFD700 50%, #F5F5F5 50%)',
  tricolore: 'linear-gradient(135deg, #FFD700 33%, #F5F5F5 33%, #F5F5F5 66%, #FFB6C1 66%)',
  champagne: '#F7E7CE',
  rodio: '#E8E8E8',
  brunito: '#8B4513',
  satinato: '#D4D4D4',
  lucido: '#FFFACD',
  opaco: '#A9A9A9',
};

// ============================================
// PIETRE
// ============================================
const STONE_LABELS: Record<string, string> = {
  diamante: 'Diamante',
  rubino: 'Rubino',
  zaffiro: 'Zaffiro',
  smeraldo: 'Smeraldo',
  ametista: 'Ametista',
  topazio: 'Topazio',
  acquamarina: 'Acquamarina',
  tormalina: 'Tormalina',
  granato: 'Granato',
  opale: 'Opale',
  tanzanite: 'Tanzanite',
  peridoto: 'Peridoto',
  citrino: 'Citrino',
  morganite: 'Morganite',
  kunzite: 'Kunzite',
  spinello: 'Spinello',
  alessandrite: 'Alessandrite',
  tsavorite: 'Tsavorite',
  zircone: 'Zircone',
  cubic_zirconia: 'Zirconia Cubica',
  perla: 'Perla',
  perla_acqua_dolce: 'Perla d\'Acqua Dolce',
  perla_tahiti: 'Perla di Tahiti',
  perla_south_sea: 'Perla South Sea',
  corallo: 'Corallo',
  turchese: 'Turchese',
  lapislazzuli: 'Lapislazzuli',
  onice: 'Onice',
  agata: 'Agata',
  giada: 'Giada',
  quarzo_rosa: 'Quarzo Rosa',
  madreperla: 'Madreperla',
  cammeo: 'Cammeo',
};

// ============================================
// GENERE
// ============================================
const GENDER_LABELS: Record<string, string> = {
  donna: 'Donna',
  uomo: 'Uomo',
  unisex: 'Unisex',
  bambino: 'Bambino/a',
  bambina: 'Bambina',
};

// ============================================
// SOTTOCATEGORIE
// ============================================
const SUBCATEGORY_LABELS: Record<string, string> = {
  anello: 'Anelli',
  bracciale: 'Bracciali',
  collana: 'Collane',
  orecchini: 'Orecchini',
  pendente: 'Pendenti',
  ciondolo: 'Ciondoli',
  gemelli: 'Gemelli',
  spilla: 'Spille',
  piercing: 'Piercing',
  cavigliera: 'Cavigliere',
  fermacravatta: 'Fermacravatta',
};

// ============================================
// CONDIZIONI
// ============================================
const CONDITION_LABELS: Record<string, string> = {
  nuovo: 'Nuovo',
  come_nuovo: 'Come Nuovo',
  ottimo: 'Ottimo Stato',
  buono: 'Buono Stato',
  discreto: 'Discreto',
  usato: 'Usato',
  ricondizionato: 'Ricondizionato',
  vintage: 'Vintage',
};

// ============================================
// LOOKUP MAPS
// ============================================
const ALL_LABELS: Record<string, Record<string, string>> = {
  material: MATERIAL_LABELS,
  material_color: MATERIAL_COLOR_LABELS,
  stone_type: STONE_LABELS,
  gender: GENDER_LABELS,
  sottocategoria: SUBCATEGORY_LABELS,
  item_condition: CONDITION_LABELS,
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Translate a filter value to its Italian label
 * Falls back to capitalizing the raw value if no translation found
 */
export function translateFilterValue(filterCode: string, value: string): string {
  // Check if the filter has a label map
  const labelMap = ALL_LABELS[filterCode];
  if (labelMap && labelMap[value]) {
    return labelMap[value];
  }
  
  // Fallback: capitalize and replace underscores
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get color swatch hex for a material color value
 */
export function getColorSwatch(colorValue: string): string | undefined {
  return COLOR_SWATCHES[colorValue];
}

/**
 * Format price in EUR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}
