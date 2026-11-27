import type { WineryCatalogWineDto, WineryPublicCatalogWineDto } from '../types';

/**
 * Adaptador de WineryCatalogWineDto (catálogo privado del dueño) a WineryPublicCatalogWineDto (catálogo público).
 * Permite renderizar las etiquetas en el Dashboard utilizando WineryPublicCatalogCard.
 */
export function toPublicCatalogWine(wine: WineryCatalogWineDto): WineryPublicCatalogWineDto {
  return {
    id: wine.id,
    name: wine.name,
    description: wine.description,
    wineType: wine.wineType,
    sourceType: wine.sourceType,
    averageRating: wine.averageRating,
    reviewCount: wine.reviewCount,
    vintages: (wine.vintages || []).map((v) => ({
      id: v.id,
      year: v.year,
      alcoholContent: v.alcoholContent,
      servingTemperature: v.servingTemperature,
      agingAdvice: v.agingAdvice,
      imageId: v.imageId,
      imageUrl: v.imageUrl,
      approvalStatus: v.approvalStatus,
      averageRating: v.averageRating,
      reviewCount: v.reviewCount,
      grapes: (v.grapes || []).map((g) => ({
        grapeId: g.grapeId,
        grapeName: g.grapeName,
        percentage: g.percentage,
      })),
    })),
  };
}

export function toPublicCatalogWines(wines: WineryCatalogWineDto[]): WineryPublicCatalogWineDto[] {
  return wines.map(toPublicCatalogWine);
}
