import { cn } from '../../../lib/utils';

export interface WineryCatalogBottleSilhouetteProps {
  className?: string;
}

/**
 * Silueta de botella estilizada para el catálogo de bodega.
 * Componente 100% propio de features/winery sin dependencias externas.
 */
export default function WineryCatalogBottleSilhouette({
  className = 'w-10 h-28 text-neutral-600',
}: WineryCatalogBottleSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 100 320"
      fill="currentColor"
      aria-hidden="true"
      className={cn('shrink-0 drop-shadow-sm', className)}
    >
      {/* Cuello y cápsula */}
      <rect x="42" y="10" width="16" height="50" rx="3" />
      <path d="M40 22 H60 V26 H40 Z" opacity="0.8" />
      {/* Hombros */}
      <path d="M42 60 C42 85, 20 105, 20 140 L20 290 C20 305, 30 310, 50 310 C70 310, 80 305, 80 290 L80 140 C80 105, 58 85, 58 60 Z" />
      {/* Hendidura de base */}
      <path d="M35 308 C45 304, 55 304, 65 308 Z" opacity="0.4" />
    </svg>
  );
}
