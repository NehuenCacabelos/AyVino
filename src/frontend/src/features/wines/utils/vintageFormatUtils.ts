/**
 * Utilidades puras de conversión bidireccional para los campos técnicos
 * de una cosecha de vino entre los tipos de API y el formato editorial de la plantilla.
 */

export function formatAlcohol(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '14.0% Vol.';
  }
  return `${value}% Vol.`;
}

export function parseAlcohol(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = parseFloat(match[1]);
  return isNaN(parsed) ? null : parsed;
}

export function formatServingTemperature(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '16°C – 18°C';
  }
  return `${value}°C`;
}

export function parseServingTemperature(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return isNaN(parsed) ? null : parsed;
}

export function formatYear(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return String(new Date().getFullYear());
  }
  return String(value);
}

export function parseYear(text: string | number | null | undefined): number | null {
  if (text == null) return null;
  if (typeof text === 'number') return isNaN(text) ? null : text;
  const match = text.trim().match(/^(\d{4})$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return isNaN(parsed) ? null : parsed;
}
