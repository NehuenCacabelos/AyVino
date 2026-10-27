import { useState } from 'react';
import { getBannerThemeByUsername } from '../../../constants/bannerThemes';
import { cn } from '../../../lib/utils';

export interface WineryBannerProps {
  wineryName?: string | null;
  bannerUrl?: string | null;
  className?: string;
  heightClassName?: string;
}

/**
 * Componente unificado para el banner de bodega.
 * Muestra una imagen personalizada con overlay oscuro si existe (proporción sugerida 3:1),
 * o un degradado temático determinista a partir del nombre de la bodega como valor por defecto.
 */
export default function WineryBanner({
  wineryName,
  bannerUrl,
  className,
  heightClassName = 'h-32 sm:h-36 md:h-44',
}: WineryBannerProps) {
  const [imageError, setImageError] = useState(false);

  const hasCustomBanner = Boolean(bannerUrl && bannerUrl.trim().length > 0 && !imageError);
  const bannerTheme = getBannerThemeByUsername(wineryName);

  if (hasCustomBanner) {
    return (
      <div
        data-testid="winery-banner-custom"
        className={cn(
          'relative w-full overflow-hidden bg-[#121015] transition-colors duration-300',
          heightClassName,
          className,
        )}
      >
        <img
          src={bannerUrl!}
          alt={wineryName ? `Banner de ${wineryName}` : 'Banner de bodega'}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
        />
        {/* Overlay oscuro para garantizar contraste de tipografía y logo superpuesto */}
        <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-[#0b0b0e] via-black/20 to-transparent pointer-events-none" />
        {/* Fade-out inferior para fundir con el fondo inmersivo */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0b0e] to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      data-testid="winery-banner-theme"
      className={cn(
        'relative w-full overflow-hidden transition-colors duration-300',
        bannerTheme.classes,
        heightClassName,
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] via-transparent to-transparent pointer-events-none',
          bannerTheme.radialOverlayClass,
        )}
      />
      {/* Fade-out inferior para fundir con el fondo inmersivo */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0b0e] to-transparent pointer-events-none" />
    </div>
  );
}
