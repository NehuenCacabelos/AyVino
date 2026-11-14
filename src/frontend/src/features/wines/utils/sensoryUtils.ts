import type { VintageSensoryDto, SensoryAxisKey } from '../api/sensoryApi';

export interface SensoryAttribute {
  key: SensoryAxisKey | string;
  label: string;
  value: number;
  calculatedValue?: number | null;
  source?: string;
  isManual?: boolean;
}

export const SENSORY_AXES_CONFIG: { key: SensoryAxisKey; label: string }[] = [
  { key: 'body', label: 'Cuerpo' },
  { key: 'tannins', label: 'Taninos' },
  { key: 'acidity', label: 'Acidez' },
  { key: 'fruit', label: 'Fruta' },
  { key: 'oak', label: 'Crianza' },
  { key: 'persistence', label: 'Persistencia' },
];

/**
 * Valores por tipo de vino (respaldo/fallback cuando no hay valores calculados ni manuales).
 * Incluye Espumoso (Sparkling) y Naranjo (Orange) igual a Blanco.
 */
export function getTypeSensoryFallback(type?: string | null): SensoryAttribute[] {
  if (!type) {
    return SENSORY_AXES_CONFIG.map(({ key, label }) => ({
      key,
      label,
      value: 0,
      source: 'Fallback',
    }));
  }

  if (type === 'Sparkling') {
    return [
      { key: 'body', label: 'Cuerpo', value: 3.0, source: 'Fallback' },
      { key: 'tannins', label: 'Taninos', value: 1.0, source: 'Fallback' },
      { key: 'acidity', label: 'Acidez', value: 4.5, source: 'Fallback' },
      { key: 'fruit', label: 'Fruta', value: 3.8, source: 'Fallback' },
      { key: 'oak', label: 'Crianza', value: 1.8, source: 'Fallback' },
      { key: 'persistence', label: 'Persistencia', value: 4.2, source: 'Fallback' },
    ];
  }

  const isWhite = type === 'White' || type === 'Orange';
  const isRose = type === 'Rose';

  if (isWhite) {
    return [
      { key: 'body', label: 'Cuerpo', value: 3.2, source: 'Fallback' },
      { key: 'tannins', label: 'Taninos', value: 1.2, source: 'Fallback' },
      { key: 'acidity', label: 'Acidez', value: 4.8, source: 'Fallback' },
      { key: 'fruit', label: 'Fruta', value: 4.6, source: 'Fallback' },
      { key: 'oak', label: 'Crianza', value: 3.5, source: 'Fallback' },
      { key: 'persistence', label: 'Persistencia', value: 4.4, source: 'Fallback' },
    ];
  }

  if (isRose) {
    return [
      { key: 'body', label: 'Cuerpo', value: 2.8, source: 'Fallback' },
      { key: 'tannins', label: 'Taninos', value: 2.0, source: 'Fallback' },
      { key: 'acidity', label: 'Acidez', value: 4.6, source: 'Fallback' },
      { key: 'fruit', label: 'Fruta', value: 4.7, source: 'Fallback' },
      { key: 'oak', label: 'Crianza', value: 1.8, source: 'Fallback' },
      { key: 'persistence', label: 'Persistencia', value: 3.9, source: 'Fallback' },
    ];
  }

  // Tinto (Red) o por defecto
  return [
    { key: 'body', label: 'Cuerpo', value: 4.7, source: 'Fallback' },
    { key: 'tannins', label: 'Taninos', value: 4.8, source: 'Fallback' },
    { key: 'acidity', label: 'Acidez', value: 4.3, source: 'Fallback' },
    { key: 'fruit', label: 'Fruta', value: 4.4, source: 'Fallback' },
    { key: 'oak', label: 'Crianza', value: 4.1, source: 'Fallback' },
    { key: 'persistence', label: 'Persistencia', value: 4.9, source: 'Fallback' },
  ];
}

export interface BuildSensoryParams {
  type?: string | null;
  server?: VintageSensoryDto | null;
  manual?: Partial<Record<SensoryAxisKey, number | null>> | null;
  preview?: VintageSensoryDto | null;
  isEditingOrNew?: boolean;
}

/**
 * Construye el perfil sensorial efectivo respetando las prioridades:
 * 1. Valor manual del borrador (solo en edición o vino nuevo).
 * 2. En lectura: valor del servidor si Source != 'None'. En edición o nuevo: valor de previsualización si no es nulo.
 * 3. Valor por tipo de getTypeSensoryFallback.
 */
export function buildSensoryAttributes({
  type,
  server,
  manual,
  preview,
  isEditingOrNew = false,
}: BuildSensoryParams): SensoryAttribute[] {
  const fallbackList = getTypeSensoryFallback(type);
  const fallbackMap = new Map(fallbackList.map((attr) => [attr.key, attr.value]));

  const serverAxesMap = new Map(server?.axes?.map((a) => [a.key, a]) ?? []);
  const previewAxesMap = new Map(preview?.axes?.map((a) => [a.key, a]) ?? []);

  return SENSORY_AXES_CONFIG.map(({ key, label }) => {
    let effectiveValue: number | null = null;
    let source = 'Fallback';
    let isManual = false;

    // 1. Manual en edición o nuevo
    if (isEditingOrNew && manual && manual[key] !== undefined && manual[key] !== null) {
      effectiveValue = manual[key]!;
      source = 'Winery';
      isManual = true;
    }

    // 2. Servidor (en lectura) o Previsualización (en edición/nuevo)
    if (effectiveValue === null) {
      if (!isEditingOrNew) {
        const serverAxis = serverAxesMap.get(key);
        if (serverAxis && serverAxis.source !== 'None' && serverAxis.value !== null) {
          effectiveValue = serverAxis.value;
          source = serverAxis.source;
        }
      } else {
        const previewAxis = previewAxesMap.get(key);
        if (previewAxis && previewAxis.value !== null) {
          effectiveValue = previewAxis.value;
          source = 'Calculated';
        }
      }
    }

    // 3. Respaldo por tipo
    if (effectiveValue === null) {
      effectiveValue = fallbackMap.get(key) ?? 0;
      source = 'Fallback';
    }

    // CalculatedValue para mostrar "Calculado desde las uvas: X,X"
    let calculatedValue: number | null = null;
    const serverAxis = serverAxesMap.get(key);
    const previewAxis = previewAxesMap.get(key);

    if (previewAxis?.value !== undefined && previewAxis.value !== null) {
      calculatedValue = previewAxis.value;
    } else if (serverAxis?.calculatedValue !== undefined && serverAxis.calculatedValue !== null) {
      calculatedValue = serverAxis.calculatedValue;
    }

    return {
      key,
      label,
      value: effectiveValue,
      calculatedValue,
      source,
      isManual,
    };
  });
}
