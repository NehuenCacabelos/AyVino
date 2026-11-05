import { useState, useEffect } from 'react';
import { getBannerThemeByUsername } from '../../../constants/bannerThemes';
import { cn } from '../../../lib/utils';
import { imageUrl } from '../../../lib/image';

export interface WineryBannerProps {
  wineryName?: string | null;
  bannerUrl?: string | null;
  bannerImageId?: string | null;
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
  bannerImageId,
  className,
  heightClassName = 'h-44 sm:h-52 md:h-60 lg:h-64',
}: WineryBannerProps) {
  const [imageError, setImageError] = useState(false);

  const effectiveBannerUrl = bannerImageId ? imageUrl(bannerImageId, 'banner') : bannerUrl;

  useEffect(() => {
    setImageError(false);
  }, [effectiveBannerUrl]);
  const hasCustomBanner = Boolean(
    effectiveBannerUrl && effectiveBannerUrl.trim().length > 0 && !imageError,
  );
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
          src={effectiveBannerUrl!.trim()}
          alt={wineryName ? `Banner de ${wineryName}` : 'Banner de bodega'}
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
        />
        {/* Overlay armónico: protege contraste y funde de forma gradual hacia el fondo inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0e] via-black/25 to-black/10 pointer-events-none" />
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
      {/* Patrón de líneas sutiles y viñeta para dotar de profundidad al degradado */}
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-black/40',
          bannerTheme.radialOverlayClass,
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0e] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
