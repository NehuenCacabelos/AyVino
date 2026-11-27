import { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo modal de confirmación accesible con soporte para foco inicial en Cancelar,
 * cierre por tecla Escape, y estados de acción destructiva ('danger') o habitual ('default').
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  tone = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Manejo de foco inicial en el botón Cancelar al abrir
  useEffect(() => {
    if (open) {
      // Pequeño timeout para asegurar montaje en el DOM
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Manejo de tecla Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open && !isLoading) {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const isDanger = tone === 'danger';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-150 text-neutral-200">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              isDanger
                ? 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                : 'border-amber-800/50 bg-amber-950/40 text-amber-300'
            )}
          >
            {isDanger ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-serif font-semibold text-zinc-100 tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-neutral-400 font-sans leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              isDanger
                ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm'
                : 'bg-[#6b1d28] hover:bg-[#85222e] text-white shadow-sm'
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isLoading ? 'Procesando...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

