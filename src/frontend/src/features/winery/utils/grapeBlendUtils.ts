export interface BlendRow {
  id: string;
  grapeId: number | '';
  percentage: number | '';
}

/**
 * Creates a new BlendRow given the selected grapeId and the current count of blend rows.
 * - If currentBlendCount === 0 (first grape in the blend), percentage defaults to 100.
 * - If currentBlendCount > 0, percentage defaults to 0 (shown visibly to be completed).
 */
export function createNewBlendRow(
  grapeId: number | '',
  currentBlendCount: number,
  idGenerator?: () => string
): BlendRow {
  const id = idGenerator
    ? idGenerator()
    : `blend-${grapeId || 'empty'}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const percentage = currentBlendCount === 0 ? 100 : 0;
  return { id, grapeId, percentage };
}

/**
 * Calculates the total sum of percentages across blend rows.
 */
export function calculateBlendTotal(blend: BlendRow[]): number {
  return blend.reduce((acc, row) => {
    const val = typeof row.percentage === 'number' ? row.percentage : Number(row.percentage);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);
}

export interface BlendValidationResult {
  isValid: boolean;
  errorMessage?: string;
  totalPercentage: number;
}

/**
 * Validates the grape blend according to AyVino business rules:
 * - Empty blend: valid (grapes are optional).
 * - All rows must have a valid selected grapeId.
 * - No duplicate grapeIds.
 * - Each grape must have a percentage > 0 and <= 100.
 * - The sum of all grape percentages must equal exactly 100%.
 */
export function validateGrapeBlend(blend: BlendRow[]): BlendValidationResult {
  const totalPercentage = calculateBlendTotal(blend);

  if (blend.length === 0) {
    return { isValid: true, totalPercentage: 0 };
  }

  const hasEmptyGrape = blend.some((b) => b.grapeId === '');
  if (hasEmptyGrape) {
    return {
      isValid: false,
      errorMessage: 'Elegí la cepa en todas las filas del corte.',
      totalPercentage,
    };
  }

  const uniqueGrapes = new Set(blend.map((b) => b.grapeId));
  if (uniqueGrapes.size !== blend.length) {
    return {
      isValid: false,
      errorMessage: 'No podés repetir la misma cepa en el corte.',
      totalPercentage,
    };
  }

  const hasInvalidPercentage = blend.some((b) => {
    const val = typeof b.percentage === 'number' ? b.percentage : Number(b.percentage);
    return !Number.isFinite(val) || val <= 0 || val > 100;
  });

  if (hasInvalidPercentage || totalPercentage !== 100) {
    return {
      isValid: false,
      errorMessage: 'Completá el porcentaje de cada uva y asegurate de que sumen 100%',
      totalPercentage,
    };
  }

  return {
    isValid: true,
    totalPercentage,
  };
}
