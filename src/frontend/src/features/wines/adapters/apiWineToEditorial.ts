import type {
  EditorialWine,
  WineWineryInfo,
  WineVintageDetail,
  WineReviewItem,
  WinePairingItem,
} from '../data/editorialWines';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  WineryResponseDto,
  GrapeResponseDto,
} from '../../winery/types';
import type { ReviewResponseDto } from '../types/review';
import { imageUrl } from '../../../lib/image';

export function mapPairingCategoryToIcon(category?: string): string {
  switch (category?.toLowerCase()) {
    case 'meat':
      return 'flame';
    case 'fish':
    case 'seafood':
      return 'utensils';
    case 'cheese':
    case 'dessert':
    case 'appetizer':
      return 'sparkles';
    case 'pasta':
    case 'vegetarian':
    case 'other':
      return 'soup';
    default:
      return 'utensils';
  }
}

export interface PairingInputDto {
  id: number;
  name: string;
  category?: string;
}

export function apiWineToEditorial(
  wine: WineResponseDto,
  vintages: WineVintageResponseDto[],
  winery: WineryResponseDto | null,
  pairings: PairingInputDto[],
  grapes: GrapeResponseDto[] | Map<number, string> | Record<number, string>,
  reviews: ReviewResponseDto[]
): EditorialWine {
  // Construir mapa de nombres de uvas
  const grapeNameMap = new Map<number, string>();
  if (grapes instanceof Map) {
    grapes.forEach((name, id) => grapeNameMap.set(id, name));
  } else if (Array.isArray(grapes)) {
    grapes.forEach((g) => grapeNameMap.set(g.id, g.name));
  } else if (typeof grapes === 'object' && grapes !== null) {
    Object.entries(grapes).forEach(([id, name]) => {
      grapeNameMap.set(Number(id), String(name));
    });
  }

  // Mapeo de Bodega
  let wineryInfo: WineWineryInfo | null = null;
  if (winery) {
    let regionStr = 'Mendoza, Argentina';
    if (winery.location) {
      regionStr = `${winery.location.regionName}, ${winery.location.stateName}`;
    }
    wineryInfo = {
      id: String(winery.id),
      name: winery.name,
      foundedYear: winery.foundationYear ?? 1900,
      websiteUrl: winery.website ?? undefined,
      region: regionStr,
    };
  }

  // Mapeo de Cosechas
  const mappedVintages: WineVintageDetail[] = (vintages && vintages.length > 0
    ? vintages
    : [
        {
          id: 0,
          wineId: wine.id,
          year: new Date().getFullYear(),
          alcoholContent: null,
          servingTemperature: null,
          agingAdvice: null,
          imageId: null,
          approvalStatus: 'Approved',
          uploadedByUserId: 0,
          registerDate: new Date(),
          averageRating: null,
          reviewCount: 0,
          grapes: [],
        } as unknown as WineVintageResponseDto,
      ]
  ).map((v) => {
    const rawGrapes = v.grapes || [];
    const mappedGrapes = rawGrapes.map((g) => {
      const grapeName = grapeNameMap.get(g.grapeId) || `Varietal #${g.grapeId}`;
      return {
        variety: grapeName,
        percentage: Number(g.percentage ?? 100),
      };
    });

    return {
      id: String(v.id),
      wineId: String(v.wineId),
      year: v.year ?? new Date().getFullYear(),
      imageId: v.imageId ? String(v.imageId) : null,
      imageUrl: v.imageId ? imageUrl(v.imageId, 'bottle') : null,
      alcoholContent:
        v.alcoholContent != null ? `${v.alcoholContent}% Vol.` : '14.0% Vol.',
      servingTemperature:
        v.servingTemperature != null
          ? `${v.servingTemperature}°C`
          : '16°C – 18°C',
      agingAdvice:
        v.agingAdvice && v.agingAdvice.trim().length > 0
          ? v.agingAdvice
          : '10 a 15 años en cava subterránea.',
      grapes: mappedGrapes,
    };
  });

  // Mapeo de Maridajes
  const mappedPairings: WinePairingItem[] = (pairings || []).map((p) => ({
    id: String(p.id),
    name: p.name,
    icon: mapPairingCategoryToIcon(p.category),
  }));

  // Mapeo de Reseñas
  const mappedReviews: WineReviewItem[] = (reviews || []).map((r) => {
    let createdAtFormatted = new Date().toISOString().split('T')[0];
    if (r.createdAt) {
      createdAtFormatted = String(r.createdAt).split('T')[0];
    }
    return {
      id: String(r.id),
      userName: r.userName || 'Usuario Coleccionista',
      vintageYear: r.vintageYear ?? mappedVintages[0]?.year ?? 0,
      rating: r.rating,
      createdAt: createdAtFormatted,
      comment: r.comment || '',
    };
  });

  // Normalizar tipo de vino
  const rawType = wine.wineType || 'Red';
  let wineType: 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Orange';
  switch (rawType.toLowerCase()) {
    case 'white':
      wineType = 'White';
      break;
    case 'rose':
      wineType = 'Rose';
      break;
    case 'sparkling':
      wineType = 'Sparkling';
      break;
    case 'orange':
      wineType = 'Orange';
      break;
    case 'red':
    default:
      wineType = 'Red';
      break;
  }

  const effectiveWineryName =
    wine.wineryNameText || winery?.name || 'Bodega Elaboradora';

  return {
    id: String(wine.id),
    slug: String(wine.id),
    name: wine.name,
    type: wineType,
    description:
      wine.description && wine.description.trim().length > 0
        ? wine.description
        : 'Etiqueta enológica noble de elaboración artesanal y perfil de terroir auténtico.',
    wineryNameText: effectiveWineryName,
    winery: wineryInfo,
    pairings: mappedPairings,
    vintages: mappedVintages,
    reviews: mappedReviews,
  };
}
