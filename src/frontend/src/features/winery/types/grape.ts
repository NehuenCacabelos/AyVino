/**
 * Tipos de color de uva (C# ColorType).
 */
export type GrapeColorType = 'Red' | 'White' | 'Rose' | 'Orange';

/**
 * Varietal / Cepa de uva del catálogo maestro (C# GrapeResponseDto).
 */
export interface GrapeResponseDto {
  id: number;
  name: string;
  colorType: GrapeColorType | string;
  typicalBody: string | null;
  typicalTannins: string | null;
  typicalAcidity: string | null;
  description: string | null;
}
