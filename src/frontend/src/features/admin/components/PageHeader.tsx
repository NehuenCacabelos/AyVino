import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Encabezado estándar para vistas del panel de administración.
 */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08] mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-400 font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

