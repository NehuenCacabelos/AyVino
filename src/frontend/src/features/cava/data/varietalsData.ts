import type { BottleKind } from '../../../types/wine';

export interface VarietalDefinition {
  value: string;
  label: string;
  group: 'Tintas' | 'Blancas' | 'Rosados' | 'Espumantes';
}

export const VARIETALS_CATALOG: VarietalDefinition[] = [
  // --- TINTAS INSIGNIA ---
  { value: 'Malbec', label: 'Malbec', group: 'Tintas' },
  { value: 'Cabernet Franc', label: 'Cabernet Franc', group: 'Tintas' },
  { value: 'Cabernet Sauvignon', label: 'Cabernet Sauvignon', group: 'Tintas' },
  { value: 'Blend de Tintas', label: 'Blend de Tintas', group: 'Tintas' },
  { value: 'Pinot Noir', label: 'Pinot Noir', group: 'Tintas' },
  { value: 'Merlot', label: 'Merlot', group: 'Tintas' },
  { value: 'Syrah', label: 'Syrah', group: 'Tintas' },
  { value: 'Bonarda', label: 'Bonarda', group: 'Tintas' },

  // --- BLANCAS ---
  { value: 'Chardonnay', label: 'Chardonnay', group: 'Blancas' },
  { value: 'Sauvignon Blanc', label: 'Sauvignon Blanc', group: 'Blancas' },
  { value: 'Torrontés', label: 'Torrontés', group: 'Blancas' },

  // --- ROSADOS ---
  { value: 'Rosado', label: 'Rosado / Blend Rosé', group: 'Rosados' },

  // --- ESPUMANTES ---
  { value: 'Espumante', label: 'Espumante (Extra Brut / Brut)', group: 'Espumantes' },
];

export function resolveWineTypeAndBottle(varietal: string): {
  wineType: 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Orange';
  bottleKind: BottleKind;
} {
  const v = varietal.toLowerCase();

  if (v.includes('espumante') || v.includes('champagne') || v.includes('brut')) {
    return { wineType: 'Sparkling', bottleKind: 'sparkling' };
  }

  if (v.includes('rosado') || v.includes('rose') || v.includes('rosé')) {
    return { wineType: 'Rose', bottleKind: 'red-burgundy' };
  }

  if (v.includes('naranjo') || v.includes('orange')) {
    return { wineType: 'Orange', bottleKind: 'white' };
  }

  if (
    v.includes('blanco') ||
    v.includes('chardonnay') ||
    v.includes('sauvignon blanc') ||
    v.includes('torrontés') ||
    v.includes('torrontes')
  ) {
    return {
      wineType: 'White',
      bottleKind: v.includes('torront') ? 'white-flute' : 'white',
    };
  }

  return { wineType: 'Red', bottleKind: 'red-burgundy' };
}

