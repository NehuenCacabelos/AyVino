export const COLOR_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinta',
  White: 'Blanca',
  Rose: 'Rosada',
  Orange: 'Naranja',
};

export const COLOR_TYPE_OPTIONS = [
  { value: 'Red', label: 'Tinta', dotClass: 'bg-rose-600' },
  { value: 'White', label: 'Blanca', dotClass: 'bg-amber-200' },
  { value: 'Rose', label: 'Rosada', dotClass: 'bg-pink-400' },
  { value: 'Orange', label: 'Naranja', dotClass: 'bg-orange-400' },
] as const;

export const TYPICAL_BODY_LABELS: Record<string, string> = {
  Light: 'Liviano',
  MediumLight: 'Medio liviano',
  Medium: 'Medio',
  MediumFull: 'Medio robusto',
  Full: 'Robusto',
};

export const TYPICAL_BODY_OPTIONS = [
  { value: 'Light', label: 'Liviano' },
  { value: 'MediumLight', label: 'Medio liviano' },
  { value: 'Medium', label: 'Medio' },
  { value: 'MediumFull', label: 'Medio robusto' },
  { value: 'Full', label: 'Robusto' },
] as const;

export const TYPICAL_TANNINS_LABELS: Record<string, string> = {
  Soft: 'Suaves',
  MediumSoft: 'Medio suaves',
  Medium: 'Medios',
  MediumAstringent: 'Medio astringentes',
  Astringent: 'Astringentes',
};

export const TYPICAL_TANNINS_OPTIONS = [
  { value: 'Soft', label: 'Suaves' },
  { value: 'MediumSoft', label: 'Medio suaves' },
  { value: 'Medium', label: 'Medios' },
  { value: 'MediumAstringent', label: 'Medio astringentes' },
  { value: 'Astringent', label: 'Astringentes' },
] as const;

export const TYPICAL_ACIDITY_LABELS: Record<string, string> = {
  Low: 'Baja',
  MediumLow: 'Media baja',
  Medium: 'Media',
  MediumHigh: 'Media alta',
  High: 'Alta',
};

export const TYPICAL_ACIDITY_OPTIONS = [
  { value: 'Low', label: 'Baja' },
  { value: 'MediumLow', label: 'Media baja' },
  { value: 'Medium', label: 'Media' },
  { value: 'MediumHigh', label: 'Media alta' },
  { value: 'High', label: 'Alta' },
] as const;

