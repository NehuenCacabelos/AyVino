export interface WineryCatalogTotalsDto {
  labels: number;
  vintages: number;
  vintagesApproved: number;
  vintagesPending: number;
  vintagesRejected: number;
}

export interface WineryCatalogGrapeDto {
  grapeId: number;
  grapeName: string;
  percentage?: number | null;
}

export interface WineryCatalogVintageDto {
  id: number;
  year?: number | null;
  alcoholContent?: number | null;
  servingTemperature?: number | null;
  agingAdvice?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string;
  averageRating?: number | null;
  reviewCount: number;
  registerDate: string;
  grapes: WineryCatalogGrapeDto[];
}

export interface WineryCatalogWineDto {
  id: number;
  name: string;
  description?: string | null;
  wineType: string;
  sourceType: string;
  averageRating?: number | null;
  reviewCount: number;
  vintages: WineryCatalogVintageDto[];
}

export interface WineryCatalogResponseDto {
  wineryId: number;
  wineryStatus: 'Pending' | 'Approved' | 'Rejected' | string;
  totals: WineryCatalogTotalsDto;
  hasMore: boolean;
  wines: WineryCatalogWineDto[];
}

export interface WineryWinePairingDto {
  id: number;
  name: string;
  category: string;
}
