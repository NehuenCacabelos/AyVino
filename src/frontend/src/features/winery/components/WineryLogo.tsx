import { useState } from 'react';
import { getWineryInitials } from '../utils/wineryUtils';

export interface WineryLogoProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
};

/**
 * Componente WineryLogo
 * Renderiza el logo oficial de la bodega si está disponible,
 * o un monograma editorial circular con iniciales como respaldo sobrio.
 */
export default function WineryLogo({
  src,
  name,
  size = 'md',
  className = '',
  alt,
}: WineryLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const hasValidLogo = Boolean(src && src.trim().length > 0 && !imageFailed);
  const initials = getWineryInitials(name);
  const sizeClass = SIZE_CLASSES[size];

  if (hasValidLogo) {
    return (
      <img
        src={src!.trim()}
        alt={alt ?? `Logo oficial de ${name || 'la bodega'}`}
        onError={() => setImageFailed(true)}
        loading="lazy"
        decoding="async"
        className={`rounded-full object-cover border border-white/10 bg-zinc-950 shadow-md shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`rounded-full bg-stone-900 border border-white/10 flex items-center justify-center font-serif font-semibold text-rose-200 shadow-md shrink-0 select-none ${sizeClass} ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
}
