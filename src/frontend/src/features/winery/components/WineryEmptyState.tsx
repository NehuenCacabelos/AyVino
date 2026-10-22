import type { ReactNode, ComponentType } from 'react';
import { Wine } from 'lucide-react';

export interface WineryEmptyStateProps {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío reutilizable para listados del panel de bodega (sin vinos, sin candidatos, etc.).
 */
export default function WineryEmptyState({
  title,
  description,
  icon: Icon = Wine,
  action,
  className = '',
}: WineryEmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-[#141416]/70 backdrop-blur-sm p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-lg ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900/80 border border-white/10 text-neutral-400 mb-4 shadow-sm">
        <Icon className="h-7 w-7 text-neutral-300" />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-100 tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm text-neutral-400 font-sans leading-relaxed max-w-md">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
