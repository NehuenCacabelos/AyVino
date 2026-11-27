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

const GRAPE_SLICE_COLORS = ['#fb7185', '#fbbf24', '#34d399', '#f97316'] as const;
const OTHER_SLICE_COLOR = '#71717a';
const MAX_TOP_GRAPES = 4;
const MAX_TOP_REGIONS = 5;

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

  const topGrapes = grapes.slice(0, MAX_TOP_GRAPES);
  const restGrapes = grapes.slice(MAX_TOP_GRAPES);

  const rawSlices = [
    ...topGrapes.map((grape, index) => ({
      label: grape.name,
      count: grape.vintageCount,
      color: GRAPE_SLICE_COLORS[index],
    })),
    ...(restGrapes.length > 0
      ? [
          {
            label: 'Otras',
            count: restGrapes.reduce((acc, item) => acc + item.vintageCount, 0),
            color: OTHER_SLICE_COLOR,
          },
        ]
      : []),
  ];

  const percents = distributeRoundedPercents(
    rawSlices.map((slice) => slice.count),
    totalPresence,
  );

  return rawSlices.map((slice, index) => ({
    label: slice.label,
    count: slice.count,
    percent: percents[index],
    color: slice.color,
  }));
}

export function buildRegionRows(
  regions: readonly RegionWineryCount[],
  totalWineries: number,
): RegionRowsResult {
  const topRegions = regions.slice(0, MAX_TOP_REGIONS);
  const restCount = Math.max(0, regions.length - MAX_TOP_REGIONS);

  const rows: RegionRow[] = topRegions.map((region) => ({
    stateId: region.stateId,
    stateName: region.stateName,
    wineryCount: region.wineryCount,
    percent: totalWineries <= 0 ? 0 : Math.round((region.wineryCount / totalWineries) * 100),
  }));

  return { rows, restCount };
}
