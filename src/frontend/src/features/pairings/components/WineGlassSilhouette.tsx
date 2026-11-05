import type { SVGProps } from 'react';

export type GlassType = 'burdeos' | 'borgona' | 'tulipan' | 'flauta';

/**
 * Detecta la categoría morfológica de copa según la descripción enológica
 */
export function detectGlassType(glassware: string): GlassType {
  const normalized = glassware.toLowerCase();
  if (normalized.includes('borgoña') || normalized.includes('borgona')) {
    return 'borgona';
  }
  if (normalized.includes('burdeos')) {
    return 'burdeos';
  }
  if (normalized.includes('flauta') || normalized.includes('espumoso')) {
    return 'flauta';
  }
  // Tulipán, copas de blanco o degustación
  return 'tulipan';
}

/**
 * Retorna una etiqueta amigable y concisa de la silueta
 */
export function getGlassDisplayName(type: GlassType): string {
  switch (type) {
    case 'borgona':
      return 'Cáliz Balón (Borgoña)';
    case 'burdeos':
      return 'Cáliz Alto (Burdeos)';
    case 'flauta':
      return 'Cáliz Esbelto (Flauta)';
    case 'tulipan':
      return 'Cáliz en U (Tulipán)';
  }
}

interface WineGlassSilhouetteProps extends SVGProps<SVGSVGElement> {
  glassware: string;
}

/**
 * Siluetas realistas y anatómicamente diferenciadas de copas de sommelier (estilo Riedel).
 * Permiten al usuario reconocer de inmediato qué copa usar según su forma característica:
 * - Borgoña: Gran cáliz balón ancho y esférico para concentrar aromas terciarios y sutiles.
 * - Burdeos: Cáliz alto y estilizado con hombros amplios para tintos con taninos y cuerpo.
 * - Tulipán / Blancos: Cáliz compacto en U para retener temperatura fresca.
 * - Flauta: Tubo estrecho y vertical para conservar las burbujas.
 */
export function WineGlassSilhouette({
  glassware,
  className = 'w-6 h-8 text-amber-400',
  ...props
}: WineGlassSilhouetteProps) {
  const type = detectGlassType(glassware);

  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* ─── BORGOÑA: Balón prominente, ancho exagerado en la base del cáliz y boca recogida ─── */}
      {type === 'borgona' && (
        <>
          {/* Cáliz balón amplio con relleno translúcido */}
          <path
            d="M12.5 5.5 H19.5 C16 5.5 28 9.5 28 16 C28 20.5 20.5 22.5 16 22.5 C11.5 22.5 4 20.5 4 16 C4 9.5 16 5.5 12.5 5.5 Z"
            fill="currentColor"
            fillOpacity="0.18"
            strokeWidth="1.5"
          />
          {/* Menisco / nivel de vino en la panza ancha */}
          <path
            d="M7 16 C11.5 18 20.5 18 25 16"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          {/* Tallo */}
          <path d="M16 22.5 V35.5" strokeWidth="1.6" />
          {/* Base ancha de apoyo */}
          <path d="M8 35.5 H24" strokeWidth="1.6" />
        </>
      )}

      {/* ─── BURDEOS: Cáliz alto, vertical y esbelto con hombros marcados ─── */}
      {type === 'burdeos' && (
        <>
          {/* Cáliz alto Burdeos */}
          <path
            d="M10.5 4 H21.5 C21.5 11 24 16 16 23 C8 16 10.5 11 10.5 4 Z"
            fill="currentColor"
            fillOpacity="0.18"
            strokeWidth="1.5"
          />
          {/* Menisco en el tercio inferior */}
          <path
            d="M12 14 C14 15.5 18 15.5 20 14"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          {/* Tallo largo */}
          <path d="M16 23 V36" strokeWidth="1.6" />
          {/* Base */}
          <path d="M9 36 H23" strokeWidth="1.6" />
        </>
      )}

      {/* ─── TULIPÁN / BLANCOS: Cáliz en U compacto y delicado ─── */}
      {type === 'tulipan' && (
        <>
          {/* Cáliz U blanco */}
          <path
            d="M11.5 7 H20.5 C20.5 12 21.5 16.5 16 21 C10.5 16.5 11.5 12 11.5 7 Z"
            fill="currentColor"
            fillOpacity="0.18"
            strokeWidth="1.5"
          />
          {/* Nivel de vino */}
          <path
            d="M13 13.5 C14.5 14.5 17.5 14.5 19 13.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          {/* Tallo esbelto */}
          <path d="M16 21 V36" strokeWidth="1.6" />
          {/* Base */}
          <path d="M10 36 H22" strokeWidth="1.6" />
        </>
      )}

      {/* ─── FLAUTA: Tubo recto, estilizado y muy estrecho ─── */}
      {type === 'flauta' && (
        <>
          {/* Cáliz flauta */}
          <path
            d="M13.5 4 H18.5 C19 12 19 18.5 16 23 C13 18.5 13 12 13.5 4 Z"
            fill="currentColor"
            fillOpacity="0.18"
            strokeWidth="1.5"
          />
          {/* Nivel de burbujas */}
          <path
            d="M14.5 12 C15.5 12.8 16.5 12.8 17.5 12"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          {/* Tallo */}
          <path d="M16 23 V36" strokeWidth="1.6" />
          {/* Base */}
          <path d="M11 36 H21" strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}
