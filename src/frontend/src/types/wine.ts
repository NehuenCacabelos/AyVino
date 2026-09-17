export interface CuratedWine {
  id: string;
  name: string;
  winery: string;
  grape: string;
  vintage: string;
  region: string;
  tastingNotes: string;
  longDescription: string;
  descriptors: string[];
  price: number;
  rating: number;
  reviewCount: number;
  isOfficial: boolean;
  aging?: string;
  pairing?: string;
  altitude?: string;
  colorAccent?: string;
}

