import { AlertCircle, RotateCcw } from 'lucide-react';
import type { ProblemDetails } from '../types';
import { getErrorMessage } from '../types';

export interface WineryErrorStateProps {
  error: ProblemDetails | string | null | unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

/**
 * Estado de error sobrio y reutilizable con soporte nativo de Problem Details (RFC 7807).
 */
export default function WineryErrorState({
  error,
  onRetry,
  title = 'No se pudo cargar la información',
  className = '',
}: WineryErrorStateProps) {
  const detail = getErrorMessage(error, 'Ocurrió un error al consultar los datos del servidor.');

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-rose-900/50 bg-[#141416] p-6 sm:p-8 text-neutral-100 flex flex-col items-center text-center max-w-xl mx-auto shadow-xl ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950/50 border border-rose-900/60 text-rose-400 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-100 tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm text-neutral-400 font-sans leading-relaxed">
        {detail}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
}

