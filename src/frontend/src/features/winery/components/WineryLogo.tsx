import { useState } from 'react';
import { getWineryInitials } from '../utils/wineryUtils';
import { cn } from '../../../lib/utils';
import { imageUrl } from '../../../lib/image';

export interface WineryLogoProps {
  src?: string | null;
  logoImageId?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
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
 * Soporta objectFit ('contain' por defecto para proteger la legibilidad de insignias y tipografía)
 * y resuelve colisiones de clases mediante cn() / tailwind-merge.
 */
export default function WineryLogo({
  src,
  logoImageId,
  name,
  size = 'md',
  className = '',
  alt,
  objectFit = 'contain',
}: WineryLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const effectiveSrc = logoImageId ? imageUrl(logoImageId, 'logo') : src;
  const hasValidLogo = Boolean(effectiveSrc && effectiveSrc.trim().length > 0 && !imageFailed);
  const initials = getWineryInitials(name);
  const sizeClass = SIZE_CLASSES[size];

  if (hasValidLogo) {
    return (
      <img
        src={effectiveSrc!.trim()}
        alt={alt ?? `Logo oficial de ${name || 'la bodega'}`}
        onError={() => setImageFailed(true)}
        loading="lazy"
        decoding="async"
        className={cn(
          'rounded-full border border-white/10 bg-zinc-950 shadow-md shrink-0',
          objectFit === 'cover' ? 'object-cover' : 'object-contain',
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <div
      data-testid="winery-monogram"
      aria-label={alt ?? `Monograma de ${name || 'la bodega'}`}
      className={cn(
        'rounded-full border border-white/15 bg-gradient-to-br from-[#2a171d] via-[#1a1216] to-[#0e0c10] flex items-center justify-center font-serif text-amber-200/90 font-semibold tracking-wider select-none shadow-md shrink-0',
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}
