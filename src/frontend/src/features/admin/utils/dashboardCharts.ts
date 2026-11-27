import type {
  GrapesDistribution,
  RegionWineryCount,
} from '../types/adminStats';

export interface GrapeSlice {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface RegionRow {
  stateId: number;
  stateName: string;
  wineryCount: number;
  percent: number;
}

export interface RegionRowsResult {
  rows: RegionRow[];
  restCount: number;
}

const GRAPE_SLICE_COLORS = [
  '#fb7185',
  '#fbbf24',
  '#34d399',
  '#f97316',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#2dd4bf',
  '#facc15',
  '#818cf8',
  '#fb923c',
  '#4ade80',
] as const;

const MAX_TOP_REGIONS = 4;

function distributeRoundedPercents(counts: readonly number[], total: number): number[] {
  const base = counts.map((count) => {
    const exact = (count * 100) / total;
    const floored = Math.floor(exact);
    const remainderNumerator = count * 100 - floored * total;
    return { floored, remainderNumerator };
  });

  const currentSum = base.reduce((acc, item) => acc + item.floored, 0);
  const remaining = 100 - currentSum;

  const rankedIndices = [...base.keys()]
    .sort((a, b) => {
      const diff = base[b].remainderNumerator - base[a].remainderNumerator;
      return diff !== 0 ? diff : a - b;
    });

  const boostedSet = new Set(rankedIndices.slice(0, Math.max(0, remaining)));

  return base.map((item, idx) => item.floored + (boostedSet.has(idx) ? 1 : 0));
}

export function buildGrapeSlices(distribution: GrapesDistribution): GrapeSlice[] {
  const { grapes } = distribution;
  if (grapes.length === 0) {
    return [];
  }

  const totalPresence = grapes.reduce((acc, item) => acc + item.vintageCount, 0);
  if (totalPresence <= 0) {
    return [];
  }

  const percents = distributeRoundedPercents(
    grapes.map((grape) => grape.vintageCount),
    totalPresence,
  );

  return grapes.map((grape, index) => ({
    label: grape.name,
    count: grape.vintageCount,
    percent: percents[index],
    color: GRAPE_SLICE_COLORS[index % GRAPE_SLICE_COLORS.length],
  }));
}

export function buildRegionRows(
  regions: readonly RegionWineryCount[],
  totalWineries: number,
  limit = MAX_TOP_REGIONS,
): RegionRowsResult {
  const safeLimit = Math.max(0, limit);
  const topRegions = regions.slice(0, safeLimit);
  const restCount = Math.max(0, regions.length - safeLimit);

  const rows: RegionRow[] = topRegions.map((region) => ({
    stateId: region.stateId,
    stateName: region.stateName,
    wineryCount: region.wineryCount,
    percent: totalWineries <= 0 ? 0 : Math.round((region.wineryCount / totalWineries) * 100),
  }));

  return { rows, restCount };
}
