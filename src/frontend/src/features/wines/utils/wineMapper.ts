import type { WineApiDto, WineVintageApiDto, CuratedWine } from '../../../types/wine';

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
    imageUrl: vintage?.imageUrl ?? undefined,
    sourceType: (wine.sourceType as 'Official' | 'Community') ?? 'Community',
    isOfficial: wine.sourceType === 'Official',
    aging: vintage?.agingAdvice ?? undefined,
    alcoholContent: vintage?.alcoholContent ?? null,
    servingTemperature: vintage?.servingTemperature ?? null,
    longDescription: wine.description ?? undefined,
  };
}

