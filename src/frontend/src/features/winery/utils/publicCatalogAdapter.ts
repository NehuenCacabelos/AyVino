import type { DashboardWine } from '../../../types/wine';
import { resolveBottleKind } from '../../../types/wine';
import { imageUrl } from '../../../lib/image';
import type { WineryPublicCatalogWineDto } from '../types';

/**
 * Adapta una etiqueta del catálogo público de la bodega (WineryPublicCatalogWineDto)
 * al modelo estándar de tarjeta del dashboard (DashboardWine).
 * 
 * - id: numérico en string (p.ej. "101")
 * - wineryId y winery: datos de la bodega
 * - varietal: uva principal o fallback derivado del tipo
 * - vintage: año más reciente entre cosechas válidas o año actual
 * - imageUrl: imagen de la botella con variante 'bottle' si existe imageId
 * - rating: promedio numérico o 0 si no tiene calificaciones
 * - bottle: silueta determinista según tipo y varietal
 */
export function adaptWineryPublicCatalogWineToDashboardWine(
  wine: WineryPublicCatalogWineDto,
  wineryName?: string,
  wineryId?: number,
  regionName?: string,
): DashboardWine {
  // 1. Cosecha con imagen o cosecha primaria
  const vintageWithImage = (wine.vintages || []).find(
    (v) => (v.imageId && v.imageId.trim().length > 0) || (v.imageUrl && v.imageUrl.trim().length > 0),
  );

  let resolvedImageUrl: string | undefined = undefined;
  if (vintageWithImage?.imageId && vintageWithImage.imageId.trim().length > 0) {
    resolvedImageUrl = imageUrl(vintageWithImage.imageId, 'bottle') || undefined;
  } else if (vintageWithImage?.imageUrl && vintageWithImage.imageUrl.trim().length > 0) {
    resolvedImageUrl = vintageWithImage.imageUrl;
  }

  const primaryVintage = (wine.vintages || [])[0];

  // 2. Varietal / uva
  const primaryGrape = primaryVintage?.grapes?.[0];
  const varietal =
    primaryGrape?.grapeName ||
    (wine.wineType?.toLowerCase() === 'white' ? 'Blancos' : 'Malbec');

  // 3. Cosecha / año
  const validYears = (wine.vintages || [])
    .map((v) => v.year)
    .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 0);

  const vintage =
    validYears.length > 0
      ? Math.max(...validYears)
      : typeof primaryVintage?.year === 'number' && primaryVintage.year > 0
        ? primaryVintage.year
        : new Date().getFullYear();

  // 4. Rating
  const rating = wine.averageRating != null ? Number(wine.averageRating) : 0;

  return {
    id: String(wine.id),
    wineryId: wineryId,
    name: wine.name,
    winery: wineryName || 'Bodega',
    region: regionName || 'Mendoza, Argentina',
    varietal,
    vintage,
    rating,
    bottle: resolveBottleKind(wine.wineType, varietal),
    imageUrl: resolvedImageUrl,
  };
}
