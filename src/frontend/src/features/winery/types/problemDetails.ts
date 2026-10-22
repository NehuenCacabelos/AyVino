/**
 * Esquema estándar RFC 7807 (Problem Details for HTTP APIs).
 * Calca la estructura enviada por el ExceptionHandlingMiddleware del backend.
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

/**
 * Extrae el objeto ProblemDetails de un error de Axios si existe.
 */
export function getProblemDetails(error: unknown): ProblemDetails | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const res = (error as { response?: { data?: unknown } }).response;
    if (res && typeof res.data === 'object' && res.data !== null) {
      return res.data as ProblemDetails;
    }
  }
  return null;
}

/**
 * Obtiene un mensaje de error legible para el usuario en español rioplatense,
 * priorizando `detail`, luego `title` y finalmente el fallback.
 */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado al procesar la solicitud.'): string {
  const problem = getProblemDetails(error);
  if (problem?.detail) {
    return problem.detail;
  }
  if (problem?.title) {
    return problem.title;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
