import type { WineApiDto, WineVintageApiDto, CuratedWine } from '../../../types/wine';
import type { WineListItemDto } from '../../winery/types/wine';
import { imageUrl } from '../../../lib/image';

export const WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto',
  White: 'Blanco',
  Rose: 'Rosado',
  Sparkling: 'Espumoso',
  Orange: 'Naranjo',
  Fortified: 'Fortificado',
  Dessert: 'Postre',
};

/**
 * Traduce el tipo de vino en inglés proveniente del backend a español rioplatense.
 */
export function translateWineType(wineType?: string | null): string {
  if (!wineType) return '';
  return WINE_TYPE_LABELS[wineType] ?? wineType;
}

/**
 * Adaptador puro que transforma las entidades de la API (.NET) al ViewModel
 * enriquecido CuratedWine utilizado en la Landing y en los componentes de catálogo.
 * Resuelve de forma defensiva los datos faltantes o dispersos.
 */
export function mapApiWineToCuratedWine(
  wine: WineApiDto,
  vintage?: WineVintageApiDto | null,
  locationName?: string
): CuratedWine {
  return {
    id: wine.id,
    name: wine.name,
    winery: wine.wineryNameText ?? 'Bodega desconocida',
    grape: 'Varietal',
    vintage: vintage?.year ? String(vintage.year) : 'NV',
    region: locationName ?? 'Argentina',
    rating: wine.averageRating ?? null,
    reviewCount: wine.reviewCount ?? 0,
    imageUrl: (vintage?.imageId ? imageUrl(vintage.imageId, 'bottle') : vintage?.imageUrl) ?? undefined,
    sourceType: (wine.sourceType as 'Official' | 'Community') ?? 'Community',
    isOfficial: wine.sourceType === 'Official',
    aging: vintage?.agingAdvice ?? undefined,
    alcoholContent: vintage?.alcoholContent ?? null,
    servingTemperature: vintage?.servingTemperature ?? null,
    longDescription: wine.description ? wine.description : undefined,
  };
}

/**
 * Mapea un elemento del listado de catálogo general (WineListItemDto) a CuratedWine
 * para su renderizado en WineCard:
 * - imagen: thumbnailImageId con imageUrl(id, 'bottle'), o silueta si es nulo.
 * - año: referenceVintageYear o 'NV' si es nulo.
 * - puntaje: null (las etiquetas no muestran promedio general; vive en la cosecha).
 * - bodega: wineryNameText (o 'Bodega desconocida').
 * - uva/tipo: tipo de vino traducido (Tinto, Blanco, Rosado, Espumoso, Naranjo).
 * - región: vacía (no se inventan datos no provistos).
 * - sourceType: preserva si es Oficial o Comunitario.
 */
export function mapWineListItemToCuratedWine(wine: WineListItemDto): CuratedWine {
  return {
    id: wine.id,
    name: wine.name,
    winery: wine.wineryNameText || 'Bodega desconocida',
    grape: translateWineType(wine.wineType),
    vintage: wine.referenceVintageYear ? String(wine.referenceVintageYear) : 'NV',
    region: '',
    rating: null,
    reviewCount: wine.reviewCount ?? 0,
    imageUrl: wine.thumbnailImageId ? (imageUrl(wine.thumbnailImageId, 'bottle') ?? undefined) : undefined,
    sourceType: (wine.sourceType as 'Official' | 'Community') ?? 'Community',
    isOfficial: wine.sourceType === 'Official',
    longDescription: wine.description ? wine.description : undefined,
  };
}
