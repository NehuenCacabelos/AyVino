import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Banner de error reutilizable con opción de reintento.
 */
export default function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-rose-900/60 bg-rose-950/30 text-rose-300 shadow-sm text-xs font-sans',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="leading-snug">{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-800/60 bg-rose-900/40 hover:bg-rose-900/60 text-white font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
}

