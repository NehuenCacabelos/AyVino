import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

/**
 * Lee el header HTTP `X-Total-Count` de una respuesta de Axios.
 * Devuelve `null` si el header no está presente o no es un entero válido.
 */
export function parseTotalCountHeader(
  headers?: RawAxiosResponseHeaders | AxiosResponseHeaders
): number | null {
  if (!headers) return null;

  const raw =
    typeof (headers as AxiosResponseHeaders).get === 'function'
      ? (headers as AxiosResponseHeaders).get('x-total-count')
      : headers['x-total-count'] ?? headers['X-Total-Count'];

  if (raw === undefined || raw === null || raw === '') return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
}
