/**
 * Formatea un valor numérico de puntuación a formato es-AR (un decimal con coma, ej: 4,3).
 * Si el valor es nulo, indefinido o NaN, retorna el fallback provisto (por defecto '—').
 */
export function formatRating(val: number | null | undefined, fallback: string = '—'): string {
  if (val === null || val === undefined || isNaN(val)) {
    return fallback;
  }
  const normalized = Math.round(val * 10) / 10;
  return normalized.toFixed(1).replace('.', ',');
}

/**
 * Normaliza un número flotante a exactamente un decimal para evitar errores de coma flotante.
 */
export function normalizeRating(val: number): number {
  return Math.round(val * 10) / 10;
}
