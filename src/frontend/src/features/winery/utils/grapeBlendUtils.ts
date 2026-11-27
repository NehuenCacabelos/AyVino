export interface BlendRow {
  id: string;
  grapeId: number | '';
  percentage: number | '';
}

/**
 * Genera una nueva fila para el corte varietal (blend).
 * - La primera uva (currentLength === 0) entra con 100% ya asignado.
 * - Las siguientes uvas entran con 0 visible en el campo.
 * - Si se eliminaron uvas hasta vaciar la lista (currentLength === 0), la próxima vuelve a entrar con 100.
 */
export function createNewBlendRow(
  grapeId: number | '',
  currentLength: number,
  idPrefix = 'blend'
): BlendRow {
  return {
    id: `${idPrefix}-${grapeId || 'empty'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    grapeId,
    percentage: currentLength === 0 ? 100 : 0,
  };
}

/**
 * Calcula la suma aritmética de porcentajes asignados en el blend.
 */
export function calculateTotalPercentage(blend: BlendRow[]): number {
  return blend.reduce((acc, row) => {
    return acc + (typeof row.percentage === 'number' ? row.percentage : 0);
  }, 0);
}

export interface GrapeBlendValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Valida la composición varietal respetando las reglas de moderación y del backend:
 * - Si no hay filas, se considera válido (sin blend especificado).
 * - No puede haber filas con cepa vacía.
 * - No puede haber filas con 0% ni porcentajes negativos.
 * - La suma total debe ser exactamente 100%.
 */
export function validateGrapeBlend(blend: BlendRow[]): GrapeBlendValidationResult {
  if (blend.length === 0) {
    return { isValid: true, errorMessage: null };
  }

  const hasEmptyGrape = blend.some((b) => b.grapeId === '');
  if (hasEmptyGrape) {
    return {
      isValid: false,
      errorMessage: 'Elegí la cepa para todas las filas del corte.',
    };
  }

  const hasZeroOrNegative = blend.some(
    (b) => typeof b.percentage !== 'number' || b.percentage <= 0
  );
  const total = calculateTotalPercentage(blend);

  if (hasZeroOrNegative || Math.abs(total - 100) > 0.001) {
    return {
      isValid: false,
      errorMessage: 'Completá el porcentaje de cada uva y asegurate de que sumen 100%',
    };
  }

  return { isValid: true, errorMessage: null };
}
