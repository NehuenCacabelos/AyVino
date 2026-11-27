import type {
  WineryCatalogWineDto,
  WineryCatalogVintageDto,
  WineryCatalogGrapeDto,
} from '../types/catalog';

export type CatalogSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'rating_desc'
  | 'year_desc';

export interface CatalogFilterCriteria {
  searchQuery?: string;
  wineType?: string;
  grape?: string;
  year?: string;
  vintageStatus?: string;
  sortBy?: CatalogSortOption;
  wineryStatus?: string;
}

/**
 * Calcula el texto representativo del rango temporal de las añadas de un vino.
 * Ejemplo: "3 añadas: 2019 a 2022", "1 añada (2020)", "Sin añadas registradas".
 */
export function getVintageYearsRange(vintages: WineryCatalogVintageDto[]): string {
  if (!vintages || vintages.length === 0) {
    return 'Sin añadas registradas';
  }

  const validYears = vintages
    .map((v) => v.year)
    .filter((y): y is number => typeof y === 'number' && !isNaN(y))
    .slice()
    .sort((a, b) => a - b);

  if (validYears.length === 0) {
    return `${vintages.length} ${vintages.length === 1 ? 'añada' : 'añadas'} (S/A)`;
  }

  const minYear = validYears[0];
  const maxYear = validYears[validYears.length - 1];

  if (minYear === maxYear) {
    return `${vintages.length} ${vintages.length === 1 ? 'añada' : 'añadas'} (${minYear})`;
  }

  return `${vintages.length} añadas: ${minYear} a ${maxYear}`;
}

/**
 * Obtiene la uva principal (mayor porcentaje) de la añada más representativa o reciente.
 */
export function getMainGrape(vintages: WineryCatalogVintageDto[]): WineryCatalogGrapeDto | null {
  if (!vintages || vintages.length === 0) return null;

  for (const vintage of vintages) {
    if (vintage.grapes && vintage.grapes.length > 0) {
      const sortedGrapes = vintage.grapes
        .slice()
        .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));
      return sortedGrapes[0];
    }
  }

  return null;
}

/**
 * Resuelve la etiqueta y tonalidad visual para el estado de una añada individual,
 * contemplando si la bodega dueña se encuentra en revisión (Pending).
 */
export function getVintageStatusBadge(
  status: string,
  wineryStatus?: string
): { label: string; tone: 'emerald' | 'amber' | 'neutral' | 'rose' } {
  const normStatus = status?.toLowerCase();
  const isWineryPending = wineryStatus === 'Pending';

  if (normStatus === 'approved') {
    return { label: 'Publicado', tone: 'emerald' };
  }

  if (normStatus === 'rejected') {
    return { label: 'Rechazado', tone: 'rose' };
  }

  if (isWineryPending) {
    return { label: 'Borrador, solo lo ves vos', tone: 'neutral' };
  }

  return { label: 'En revisión', tone: 'amber' };
}

/**
 * Genera el resumen de fichas por estado de un vino para exhibir en chips.
 */
export function getVintageStatusSummary(
  vintages: WineryCatalogVintageDto[],
  wineryStatus?: string
): { label: string; tone: 'emerald' | 'amber' | 'neutral' | 'rose' }[] {
  if (!vintages || vintages.length === 0) return [];

  const counts = {
    approved: 0,
    pending: 0,
    rejected: 0,
  };

  for (const v of vintages) {
    const s = v.approvalStatus?.toLowerCase();
    if (s === 'approved') counts.approved++;
    else if (s === 'rejected') counts.rejected++;
    else counts.pending++;
  }

  const chips: { label: string; tone: 'emerald' | 'amber' | 'neutral' | 'rose' }[] = [];
  const isWineryPending = wineryStatus === 'Pending';

  if (counts.approved > 0) {
    chips.push({
      label: `${counts.approved} ${counts.approved === 1 ? 'publicada' : 'publicadas'}`,
      tone: 'emerald',
    });
  }

  if (counts.pending > 0) {
    if (isWineryPending) {
      chips.push({
        label: `${counts.pending} ${counts.pending === 1 ? 'borrador' : 'borradores'}`,
        tone: 'neutral',
      });
    } else {
      chips.push({
        label: `${counts.pending} en revisión`,
        tone: 'amber',
      });
    }
  }

  if (counts.rejected > 0) {
    chips.push({
      label: `${counts.rejected} ${counts.rejected === 1 ? 'rechazada' : 'rechazadas'}`,
      tone: 'rose',
    });
  }

  return chips;
}

/**
 * Filtra y ordena inmutablemente las etiquetas del catálogo en memoria.
 */
export function filterAndSortCatalogWines(
  wines: WineryCatalogWineDto[],
  criteria: CatalogFilterCriteria
): WineryCatalogWineDto[] {
  const {
    searchQuery = '',
    wineType = 'All',
    grape = 'All',
    year = 'All',
    vintageStatus = 'All',
    sortBy = 'name_asc',
    wineryStatus,
  } = criteria;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // 1. Filtrado
  const filtered = wines.filter((wine) => {
    // Búsqueda por nombre
    if (normalizedQuery && !wine.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    // Filtro por tipo de vino
    if (wineType !== 'All' && wine.wineType.toLowerCase() !== wineType.toLowerCase()) {
      return false;
    }

    // Filtro por uva (cualquier añada que la contenga)
    if (grape !== 'All') {
      const hasGrape = wine.vintages.some((v) =>
        v.grapes.some((g) => g.grapeName.toLowerCase() === grape.toLowerCase())
      );
      if (!hasGrape) return false;
    }

    // Filtro por año de añada
    if (year !== 'All') {
      const targetYear = Number(year);
      const hasYear = wine.vintages.some((v) => v.year === targetYear);
      if (!hasYear) return false;
    }

    // Filtro por estado de añada
    if (vintageStatus !== 'All') {
      const isWineryPending = wineryStatus === 'Pending';
      const hasStatus = wine.vintages.some((v) => {
        const s = v.approvalStatus.toLowerCase();
        if (vintageStatus === 'Draft') {
          return isWineryPending && s === 'pending';
        }
        if (vintageStatus === 'Pending') {
          return !isWineryPending && s === 'pending';
        }
        return s === vintageStatus.toLowerCase();
      });
      if (!hasStatus) return false;
    }

    return true;
  });

  // 2. Orden inmutable
  return filtered.slice().sort((a, b) => {
    switch (sortBy) {
      case 'name_desc':
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });

      case 'rating_desc': {
        const ratingA = a.averageRating ?? -1;
        const ratingB = b.averageRating ?? -1;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }

      case 'year_desc': {
        const newestYearA = Math.max(
          ...a.vintages.map((v) => v.year ?? -1),
          -1
        );
        const newestYearB = Math.max(
          ...b.vintages.map((v) => v.year ?? -1),
          -1
        );
        if (newestYearB !== newestYearA) return newestYearB - newestYearA;
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }

      case 'name_asc':
      default:
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    }
  });
}
