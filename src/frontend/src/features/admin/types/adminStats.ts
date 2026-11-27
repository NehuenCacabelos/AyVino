export interface UserStats {
  total: number;
  blocked: number;
}

export interface WineryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface CityStats {
  pending: number;
}

export interface VintageStats {
  pending: number;
  approved: number;
  rejected: number;
}

export interface WineStats {
  total: number;
  community: number;
  official: number;
}

export interface ReviewStats {
  total: number;
}

export interface AdminStatsDto {
  users: UserStats;
  wineries: WineryStats;
  cities: CityStats;
  vintages: VintageStats;
  wines: WineStats;
  reviews: ReviewStats;
}

export interface GrapePresence {
  grapeId: number;
  name: string;
  vintageCount: number;
}

export interface GrapesDistribution {
  totalVintages: number;
  grapes: GrapePresence[];
}

export interface RegionWineryCount {
  stateId: number;
  stateName: string;
  wineryCount: number;
}

export interface WineryPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  stateName: string | null;
  cityName: string | null;
}

export interface WineriesByRegion {
  totalWineries: number;
  withoutCoordinates: number;
  regions: RegionWineryCount[];
  pins: WineryPin[];
}
