export const WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto',
  White: 'Blanco',
  Rose: 'Rosado',
  Sparkling: 'Espumante',
  Orange: 'Naranjo',
};

export const getWineTypeLabel = (wineType: string): string =>
  WINE_TYPE_LABELS[wineType] ?? wineType;
