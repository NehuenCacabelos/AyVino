export interface WineryLoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Estado de carga sobrio para las vistas y secciones del panel de bodega.
 */
export default function WineryLoadingState({
  message = 'Sincronizando datos de bodega...',
  className = '',
}: WineryLoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={`min-h-[320px] flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Halo sutil de fondo */}
        <div className="absolute h-14 w-14 rounded-full bg-rose-900/20 blur-xl" />
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#6e1a24] animate-spin" />
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-neutral-400">
        {message}
      </p>
    </div>
  );
}
