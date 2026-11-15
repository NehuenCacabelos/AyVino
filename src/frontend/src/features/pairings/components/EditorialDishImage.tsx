import { useState } from 'react';
import { Utensils } from 'lucide-react';

interface EditorialDishImageProps {
  src?: string;
  alt: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  className?: string;
}

/**
 * EditorialDishImage Component
 * Contenedor visual de fotografía gastronómica estilo revista "Cuaderno Enogastronómico":
 * - Altura fija responsiva con aspect ratio preservado
 * - Gradientes de fusión nocturna (#0e0e10)
 * - Skeleton loader / Fallback visual con micro-gradiente borravino ante fallos de carga
 * - Badge flotante superior con glassmorphism
 */
export function EditorialDishImage({
  src,
  alt,
  badge,
  badgeIcon,
  className = '',
}: EditorialDishImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  return (
    <div
      className={`relative w-full h-52 overflow-hidden bg-[#1c1b1d] select-none ${className}`}
    >
      {/* Fallback o Placeholder mientras carga o si falla */}
      {(!imageLoaded || hasError) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1e1418] via-[#141316] to-[#0e0e10] p-4 text-center animate-pulse"
          aria-hidden="true"
        >
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#ffb2b8]/40 mb-2">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {hasError ? 'Fotografía de archivo' : 'Cargando imagen...'}
          </span>
        </div>
      )}

      {/* Imagen Real con efecto hover zoom */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Gradiente de sombra editorial nocturna */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Badge Flotante Superior (si existe) */}
      {badge && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-lg">
          {badgeIcon && <span className="text-[#fbbf24] shrink-0">{badgeIcon}</span>}
          <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#fbbf24]">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

export default EditorialDishImage;

