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
