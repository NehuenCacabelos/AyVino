import apiClient from '../../../services/apiClient';
import type { GrapeResponseDto } from '../../winery/types';

let inMemoryGrapesCache: GrapeResponseDto[] | null = null;

/**
 * Limpia la caché en memoria y en sessionStorage (útil para pruebas y recarga manual).
 */
export function clearGrapesCatalogCache(): void {
  inMemoryGrapesCache = null;
  try {
    sessionStorage.removeItem('ayvino_grapes_catalog');
  } catch {
    // Ignorar fallas de sessionStorage
  }
}

/**
 * Carga el catálogo de uvas exactamente una vez por sesión (memoria + sessionStorage).
 * Utiliza paginación con pageSize: 100 para no exceder los límites del backend.
 */
export async function fetchGrapesCatalogOnce(): Promise<GrapeResponseDto[]> {
  if (inMemoryGrapesCache && inMemoryGrapesCache.length > 0) {
    return inMemoryGrapesCache;
  }

  try {
    const cached = sessionStorage.getItem('ayvino_grapes_catalog');
    if (cached) {
      const parsed = JSON.parse(cached) as GrapeResponseDto[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryGrapesCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignorar fallas de sessionStorage
  }

  try {
    const all: GrapeResponseDto[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const res = await apiClient.get<GrapeResponseDto[]>('/grapes', {
        params: { pageNumber: page, pageSize },
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      all.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    if (all.length > 0) {
      inMemoryGrapesCache = all;
      try {
        sessionStorage.setItem('ayvino_grapes_catalog', JSON.stringify(all));
      } catch {
        // Ignorar quota errors
      }
      return all;
    }

    return inMemoryGrapesCache || [];
  } catch {
    return inMemoryGrapesCache || [];
  }
}

/**
 * Ordena las uvas priorizando las del color del tipo de vino seleccionado.
 * Tinto: color Red primero.
 * Blanco: color White primero.
 * Rosado: color Rose / Red primero.
 * Naranjo: color White / Rose primero.
 * Espumoso: White / Rose / Red primero.
 * Ambas sublistas ordenadas alfabéticamente en español.
 */
export function sortGrapesForWineType(grapes: GrapeResponseDto[], wineType: string): GrapeResponseDto[] {
  const matchesColor = (g: GrapeResponseDto) => {
    const col = (g.colorType || '').toLowerCase();
    switch (wineType) {
      case 'Red':
        return col === 'red';
      case 'White':
        return col === 'white';
      case 'Rose':
        return col === 'rose' || col === 'red';
      case 'Orange':
        return col === 'white' || col === 'rose';
      case 'Sparkling':
        return col === 'white' || col === 'rose' || col === 'red';
      default:
        return true;
    }
  };

  const prioritized = grapes.filter(matchesColor).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const others = grapes.filter((g) => !matchesColor(g)).sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return [...prioritized, ...others];
}
