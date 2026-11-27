import { isAxiosError } from 'axios';
import type { ProblemDetails } from '../../winery/types/problemDetails';

/**
 * Extrae un mensaje de error en español para mostrar en la interfaz de administración.
 * Prioridad:
 * 1. response.data.detail
 * 2. response.data.title
 * 3. Error de red o timeout: "No se pudo conectar con el servidor."
 * 4. Fallback: "Ocurrió un error inesperado."
 */
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<ProblemDetails>(error)) {
    if (!error.response || error.code === 'ECONNABORTED') {
      return 'No se pudo conectar con el servidor.';
    }

    const data = error.response.data;
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
        return data.detail;
      }
      if (typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title;
      }
    }

    return 'Ocurrió un error inesperado.';
  }

  if (error instanceof Error && error.message) {
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return 'No se pudo conectar con el servidor.';
    }
  }

  return 'Ocurrió un error inesperado.';
}

