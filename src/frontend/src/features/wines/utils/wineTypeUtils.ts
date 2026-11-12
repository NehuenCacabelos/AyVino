export const REAL_WINE_TYPES = [
  { value: 'Red', label: 'Tinto' },
  { value: 'White', label: 'Blanco' },
  { value: 'Rose', label: 'Rosado' },
  { value: 'Sparkling', label: 'Espumoso' },
  { value: 'Orange', label: 'Naranjo' },
] as const;

export const REAL_WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto',
  White: 'Blanco',
  Rose: 'Rosado',
  Sparkling: 'Espumoso',
  Orange: 'Naranjo',
};

export const MOCK_WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto Noble',
  White: 'Blanco & Mineral',
  Rose: 'Rosado & Criolla',
  Sparkling: 'Espumoso Método Tradicional',
  Orange: 'Naranjo',
};

/**
 * Obtiene la etiqueta en español del tipo de vino real (Tinto, Blanco, Rosado, Espumoso, Naranjo).
 */
export function getRealWineTypeLabel(type: string): string {
  return REAL_WINE_TYPE_LABELS[type] ?? type;
}

/**
 * Obtiene la etiqueta descriptiva usada exclusivamente para los vinos de maqueta/editorial.
 */
export function getMockWineTypeLabel(type: string): string {
  return MOCK_WINE_TYPE_LABELS[type] ?? type.toUpperCase();
}

/**
 * Función unificada para resolver la etiqueta adecuada según si el vino es real o de maqueta.
 */
export function getWineTypeLabel(type: string, isRealWine = false): string {
  return isRealWine ? getRealWineTypeLabel(type) : getMockWineTypeLabel(type);
}
