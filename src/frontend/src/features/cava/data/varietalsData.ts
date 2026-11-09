import type { BottleKind } from '../../../types/wine';

export interface VarietalDefinition {
  value: string;
  label: string;
  group: 'Tintas' | 'Blancas' | 'Rosados' | 'Espumantes' | 'Especiales';
  isPopular?: boolean;
}

export const VARIETALS_CATALOG: VarietalDefinition[] = [
  // --- TINTAS POPULARES ---
  { value: 'Malbec', label: 'Malbec', group: 'Tintas', isPopular: true },
  { value: 'Cabernet Sauvignon', label: 'Cabernet Sauvignon', group: 'Tintas', isPopular: true },
  { value: 'Cabernet Franc', label: 'Cabernet Franc', group: 'Tintas', isPopular: true },
  { value: 'Blend de Tintas', label: 'Blend de Tintas', group: 'Tintas', isPopular: true },
  { value: 'Pinot Noir', label: 'Pinot Noir', group: 'Tintas', isPopular: true },
  { value: 'Merlot', label: 'Merlot', group: 'Tintas', isPopular: true },
  { value: 'Syrah', label: 'Syrah', group: 'Tintas', isPopular: true },
  { value: 'Bonarda', label: 'Bonarda', group: 'Tintas', isPopular: true },

  // --- TINTAS AMPLIADAS ---
  { value: 'Tannat', label: 'Tannat', group: 'Tintas' },
  { value: 'Petit Verdot', label: 'Petit Verdot', group: 'Tintas' },
  { value: 'Tempranillo', label: 'Tempranillo', group: 'Tintas' },
  { value: 'Sangiovese', label: 'Sangiovese', group: 'Tintas' },
  { value: 'Garnacha', label: 'Garnacha', group: 'Tintas' },
  { value: 'Barbera', label: 'Barbera', group: 'Tintas' },
  { value: 'Marselan', label: 'Marselan', group: 'Tintas' },
  { value: 'Touriga Nacional', label: 'Touriga Nacional', group: 'Tintas' },
  { value: 'Ancellotta', label: 'Ancellotta', group: 'Tintas' },
  { value: 'Pinot Meunier', label: 'Pinot Meunier', group: 'Tintas' },

  // --- BLANCAS POPULARES ---
  { value: 'Chardonnay', label: 'Chardonnay', group: 'Blancas', isPopular: true },
  { value: 'Sauvignon Blanc', label: 'Sauvignon Blanc', group: 'Blancas', isPopular: true },
  { value: 'Torrontés Riojano', label: 'Torrontés Riojano', group: 'Blancas', isPopular: true },
  { value: 'Blend de Blancas', label: 'Blend de Blancas', group: 'Blancas', isPopular: true },

  // --- BLANCAS AMPLIADAS ---
  { value: 'Torrontés Sanjuanino', label: 'Torrontés Sanjuanino', group: 'Blancas' },
  { value: 'Torrontés Mendocino', label: 'Torrontés Mendocino', group: 'Blancas' },
  { value: 'Pinot Gris', label: 'Pinot Gris', group: 'Blancas' },
  { value: 'Semillón', label: 'Semillón', group: 'Blancas' },
  { value: 'Chenin Blanc', label: 'Chenin Blanc', group: 'Blancas' },
  { value: 'Viognier', label: 'Viognier', group: 'Blancas' },
  { value: 'Pedro Giménez', label: 'Pedro Giménez', group: 'Blancas' },
  { value: 'Moscatel de Alejandría', label: 'Moscatel de Alejandría', group: 'Blancas' },
  { value: 'Riesling', label: 'Riesling', group: 'Blancas' },
  { value: 'Gewürztraminer', label: 'Gewürztraminer', group: 'Blancas' },
  { value: 'Verdejo', label: 'Verdejo', group: 'Blancas' },
  { value: 'Albariño', label: 'Albariño', group: 'Blancas' },

  // --- ROSADOS Y CRIOLLAS ---
  { value: 'Rosado', label: 'Rosado / Blend Rosé', group: 'Rosados', isPopular: true },
  { value: 'Criolla Grande', label: 'Criolla Grande', group: 'Rosados' },
  { value: 'Cereza', label: 'Cereza', group: 'Rosados' },
  { value: 'Moscatel Rosado', label: 'Moscatel Rosado', group: 'Rosados' },

  // --- ESPUMANTES ---
  { value: 'Espumante Extra Brut', label: 'Espumante Extra Brut', group: 'Espumantes', isPopular: true },
  { value: 'Espumante Brut Nature', label: 'Espumante Brut Nature', group: 'Espumantes', isPopular: true },
  { value: 'Espumante Nature', label: 'Espumante Nature', group: 'Espumantes' },
  { value: 'Espumante Brut', label: 'Espumante Brut', group: 'Espumantes' },
  { value: 'Espumante Demi Sec', label: 'Espumante Demi Sec', group: 'Espumantes' },
  { value: 'Espumante Rosé', label: 'Espumante Rosé', group: 'Espumantes' },

  // --- ESPECIALES Y OTROS ---
  { value: 'Vino Naranjo', label: 'Vino Naranjo (Orange)', group: 'Especiales' },
  { value: 'Cosecha Tardía', label: 'Cosecha Tardía / Dulce Natural', group: 'Especiales' },
];

export function resolveWineTypeAndBottle(varietal: string): {
  wineType: 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Orange';
  bottleKind: BottleKind;
} {
  const v = varietal.toLowerCase();

  if (
    v.includes('espumante') ||
    v.includes('champagne') ||
    v.includes('extra brut') ||
    v.includes('nature') ||
    v.includes('brut') ||
    v.includes('demi sec') ||
    v.includes('espumoso')
  ) {
    return { wineType: 'Sparkling', bottleKind: 'sparkling' };
  }

  if (
    v.includes('rosado') ||
    v.includes('rose') ||
    v.includes('rosé') ||
    v.includes('criolla') ||
    v.includes('cereza') ||
    v.includes('moscatel rosado')
  ) {
    return { wineType: 'Rose', bottleKind: 'red-burgundy' };
  }

  if (v.includes('naranjo') || v.includes('orange')) {
    return { wineType: 'Orange', bottleKind: 'white' };
  }

  if (
    v.includes('blanco') ||
    v.includes('blanca') ||
    v.includes('chardonnay') ||
    v.includes('sauvignon blanc') ||
    v.includes('torrontés') ||
    v.includes('torrontes') ||
    v.includes('pinot gris') ||
    v.includes('semillón') ||
    v.includes('semillon') ||
    v.includes('chenin') ||
    v.includes('viognier') ||
    v.includes('pedro giménez') ||
    v.includes('pedro gimenez') ||
    v.includes('moscatel de alejandría') ||
    v.includes('riesling') ||
    v.includes('gewürztraminer') ||
    v.includes('verdejo') ||
    v.includes('albariño') ||
    v.includes('albarino') ||
    v.includes('tardía') ||
    v.includes('tardia')
  ) {
    return {
      wineType: 'White',
      bottleKind: v.includes('torront') ? 'white-flute' : 'white',
    };
  }

  return { wineType: 'Red', bottleKind: 'red-burgundy' };
}
