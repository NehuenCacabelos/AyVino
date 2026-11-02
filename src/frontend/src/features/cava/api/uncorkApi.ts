import { apiClient } from '../../../services/apiClient';

export interface UncorkRequest {
  wineVintageId: number;
  cellarId?: number | null;
  rating?: number | null;
  comment?: string | null;
  occurredAt?: string | null;
}

export interface UncorkResponse {
  activityId: number;
  occurredAt: string;
  remainingQuantity: number | null;
  reviewId: number | null;
}

/**
 * Convierte una fecha elegida en el selector (YYYY-MM-DD) al formato ISO con las 12:00 hora local.
 * Si la fecha seleccionada es hoy o vacía, devuelve undefined (el backend usará 'ahora').
 */
export function formatUncorkDate(dateString: string): string | undefined {
  if (!dateString) return undefined;
  const today = new Date().toISOString().split('T')[0];
  if (dateString === today) {
    return undefined;
  }
  // Fecha pasada: mediodía local
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return localDate.toISOString();
}

/**
 * Registra un descorche de vino (POST /api/uncorks).
 */
export async function createUncork(data: UncorkRequest): Promise<UncorkResponse> {
  const payload = {
    wineVintageId: data.wineVintageId,
    cellarId: data.cellarId ? data.cellarId : null,
    rating: data.rating ? data.rating : null,
    comment: data.comment?.trim() ? data.comment.trim() : null,
    occurredAt: data.occurredAt || null,
  };
  const response = await apiClient.post<UncorkResponse>('/uncorks', payload);
  return response.data;
}
