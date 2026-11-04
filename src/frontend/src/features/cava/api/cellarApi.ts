import { apiClient } from '../../../services/apiClient';
import { imageUrl } from '../../../lib/image';
import type { CellarDto, CellarItemDto } from '../../users/types';
import type { BottleKind } from '../../../types/wine';
import type { CellarWine } from '../types';

export interface CellarGlobalSummaryDto {
  totalBottles: number;
  dominantVarietal: string | null;
  dominantVarietalPercentage: number | null;
}

/**
 * Obtiene el resumen global de botellas y varietal insignia del usuario (GET /api/cellars/me/summary).
 */
export async function getCellarGlobalSummaryApi(): Promise<CellarGlobalSummaryDto> {
  const response = await apiClient.get<CellarGlobalSummaryDto>('/cellars/me/summary');
  return response.data;
}

/**
 * Obtiene todas las cavas del usuario autenticado (GET /api/cellars/me).
 */
export async function getCellarsApi(): Promise<CellarDto[]> {
  const response = await apiClient.get<CellarDto[]>('/cellars/me');
  return response.data;
}

/**
 * Crea una nueva cava para el usuario autenticado (POST /api/cellars).
 */
export async function createCellarApi(data: { name: string }): Promise<CellarDto> {
  const response = await apiClient.post<CellarDto>('/cellars', { name: data.name.trim() });
  return response.data;
}

/**
 * Renombra una cava existente (PUT /api/cellars/{cellarId}).
 */
export async function renameCellarApi(cellarId: number, data: { name: string }): Promise<CellarDto> {
  const response = await apiClient.put<CellarDto>(`/cellars/${cellarId}`, { name: data.name.trim() });
  return response.data;
}

/**
 * Elimina una cava vacía (DELETE /api/cellars/{cellarId}).
 */
export async function deleteCellarApi(cellarId: number): Promise<void> {
  await apiClient.delete(`/cellars/${cellarId}`);
}

/**
 * Agrega una cosecha a una cava (POST /api/cellars/{cellarId}/items).
 */
export async function addCellarItemApi(
  cellarId: number,
  data: {
    wineVintageId: number;
    quantity: number;
    purchaseDate?: string | null;
    notes?: string | null;
  }
): Promise<CellarItemDto> {
  const payload = {
    wineVintageId: data.wineVintageId,
    quantity: data.quantity,
    purchaseDate: data.purchaseDate ? data.purchaseDate : null,
    notes: data.notes?.trim() ? data.notes.trim() : null,
  };
  const response = await apiClient.post<CellarItemDto>(`/cellars/${cellarId}/items`, payload);
  return response.data;
}

/**
 * Obtiene los ítems de una cava (GET /api/cellars/{cellarId}/items).
 */
export async function getCellarItemsApi(cellarId: number): Promise<CellarItemDto[]> {
  const response = await apiClient.get<CellarItemDto[]>(`/cellars/${cellarId}/items`);
  return response.data;
}

/**
 * Obtiene el detalle de un ítem de cava (GET /api/cellars/{cellarId}/items/{wineVintageId}).
 */
export async function getCellarItemApi(cellarId: number, wineVintageId: number): Promise<CellarItemDto> {
  const response = await apiClient.get<CellarItemDto>(`/cellars/${cellarId}/items/${wineVintageId}`);
  return response.data;
}

/**
 * Actualiza cantidad, fecha de compra y notas de una botella (PUT /api/cellars/{cellarId}/items/{wineVintageId}).
 * El backend reemplaza todos los campos: enviamos cantidad, fecha y notas completos.
 */
export async function updateCellarItemApi(
  cellarId: number,
  wineVintageId: number,
  data: {
    quantity: number;
    purchaseDate?: string | null;
    notes?: string | null;
  }
): Promise<CellarItemDto> {
  const payload = {
    quantity: data.quantity,
    purchaseDate: data.purchaseDate ? data.purchaseDate : null,
    notes: data.notes?.trim() ? data.notes.trim() : null,
  };
  const response = await apiClient.put<CellarItemDto>(`/cellars/${cellarId}/items/${wineVintageId}`, payload);
  return response.data;
}

/**
 * Quita una cosecha de la cava (DELETE /api/cellars/{cellarId}/items/{wineVintageId}).
 */
export async function deleteCellarItemApi(cellarId: number, wineVintageId: number): Promise<void> {
  await apiClient.delete(`/cellars/${cellarId}/items/${wineVintageId}`);
}

/**
 * Extrae mensaje legible de error de respuesta Problem Details en español.
 */
export function extractCellarErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { data?: { detail?: string; title?: string } }; message?: string };
    if (anyErr.response?.data?.detail) return anyErr.response.data.detail;
    if (anyErr.response?.data?.title) return anyErr.response.data.title;
  }
  return fallback;
}

/**
 * Mapea el tipo de vino del backend a BottleKind visual.
 */
export function mapWineTypeToBottleKind(wineType?: string | null): BottleKind {
  const t = (wineType || '').toLowerCase();
  if (t.includes('white') || t.includes('blanco')) return 'white';
  if (t.includes('sparkling') || t.includes('espumos')) return 'sparkling';
  if (t.includes('rose') || t.includes('rosad')) return 'red-cream';
  return 'red-burgundy';
}

/**
 * Mapea un CellarItemDto del backend a CellarWine sin inventar campos no especificados.
 */
export function mapCellarItemToCellarWine(item: CellarItemDto, cellarId: number): CellarWine {
  return {
    id: `${cellarId}-${item.wineVintageId}`,
    cellarId,
    wineId: item.wineId,
    wineVintageId: item.wineVintageId,
    name: item.name,
    winery: item.wineryNameText || (item.wineryId ? 'Bodega Oficial' : 'Sin bodega registrada'),
    vintage: item.year ?? null,
    rating: item.averageRating != null ? Number(item.averageRating) : null,
    criticBadge: undefined,
    units: item.quantity,
    isJewel: item.averageRating != null && Number(item.averageRating) >= 4.5,
    bottle: mapWineTypeToBottleKind(item.wineType),
    imageUrl: (item.imageId ? imageUrl(item.imageId, 'bottle') : item.imageUrl) || undefined,
    purchaseDate: item.purchaseDate ?? null,
    notes: item.notes ?? null,
    lastChangeAt: item.lastChangeAt,
  };
}
