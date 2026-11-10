import type { BottleKind } from '../../../types/wine';

interface BottleVectorProps {
  kind: BottleKind;
  className?: string;
  alt?: string;
}

/**
 * BottleVector Component
 * Ilustración vectorial elegante de botella de vino estilizada con acabados editoriales:
 * cristal oscuro/ámbar/esmeralda según tipo, cápsula metalizada y etiqueta noble texturada.
 */
export default function BottleVector({ kind, className = 'h-52 w-auto', alt }: BottleVectorProps) {
  // Configuración de estilo según la variante vinícola
  const getBottleSpecs = () => {
    switch (kind) {
      case 'red-black':
        return {
          glassGradient: ['#120205', '#24060c', '#080102'],
          capsuleColor: '#171717',
          capsuleAccent: '#d4af37',
          labelBg: '#1f1e1d',
          labelBorder: '#d4af37',
          labelTextColor: '#f7f4ed',
          shoulderShape: 'standard',
          subLabel: 'GRAN RESERVA',
        };
      case 'red-burgundy':
        return {
          glassGradient: ['#23050b', '#3b0a15', '#160205'],
          capsuleColor: '#700d1f',
          capsuleAccent: '#c59b27',
          labelBg: '#faf8f5',
          labelBorder: '#881337',
          labelTextColor: '#4c0519',
          shoulderShape: 'burgundy',
          subLabel: 'VALLE DE UCO',
        };
      case 'white':
        return {
          glassGradient: ['#283618', '#606c38', '#1b240e'],
          capsuleColor: '#9f1239',
          capsuleAccent: '#e2dbcc',
          labelBg: '#fcfbf9',
          labelBorder: '#d6cebf',
          labelTextColor: '#1c1917',
          shoulderShape: 'standard',
          subLabel: 'CHARDONNAY',
        };
      case 'white-flute':
        return {
          glassGradient: ['#344e41', '#588157', '#283618'],
          capsuleColor: '#b48c36',
          capsuleAccent: '#fefae0',
          labelBg: '#ffffff',
          labelBorder: '#b48c36',
          labelTextColor: '#1c1917',
          shoulderShape: 'flute',
          subLabel: 'TORRONTÉS',
        };
      case 'sparkling':
        return {
          glassGradient: ['#192314', '#2d3e23', '#0e150b'],
          capsuleColor: '#c59b27',
          capsuleAccent: '#ffe6a7',
          labelBg: '#0f172a',
          labelBorder: '#c59b27',
          labelTextColor: '#f8fafc',
          shoulderShape: 'sparkling',
          subLabel: 'EXTRA BRUT',
        };
      case 'red-cream':
      default:
        return {
          glassGradient: ['#1c0408', '#380a13', '#110103'],
          capsuleColor: '#4c0519',
          capsuleAccent: '#b48c36',
          labelBg: '#fbf9f4',
          labelBorder: '#b48c36',
          labelTextColor: '#4c0519',
          shoulderShape: 'standard',
          subLabel: 'MALBEC',
        };
    }
  };

  const specs = getBottleSpecs();

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label={alt || `Botella de vino tipo ${kind}`}
    >
      <svg
        viewBox="0 0 100 300"
        className="h-full w-auto drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente de vidrio principal */}
          <linearGradient id={`glass-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={specs.glassGradient[0]} />
            <stop offset="35%" stopColor={specs.glassGradient[1]} />
            <stop offset="85%" stopColor={specs.glassGradient[0]} />
            <stop offset="100%" stopColor={specs.glassGradient[2]} />
          </linearGradient>

          {/* Reflejo longitudinal especular */}
          <linearGradient id="specular-reflection" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>

          {/* Gradiente para la cápsula */}
          <linearGradient id={`capsule-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={specs.capsuleColor} />
            <stop offset="50%" stopColor={specs.capsuleAccent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={specs.capsuleColor} />
          </linearGradient>
        </defs>

        {/* Silueta según forma de hombros */}
        {specs.shoulderShape === 'burgundy' ? (
          // Botella Borgoña: hombros caídos fluidos
          <path
            d="M44 10 H56 V55 C56 75 74 100 74 125 V285 C74 290 70 294 64 294 H36 C30 294 26 290 26 285 V125 C26 100 44 75 44 55 Z"
            fill={`url(#glass-${kind})`}
          />
        ) : specs.shoulderShape === 'flute' ? (
          // Botella Flauta: alargada, esbelta
          <path
            d="M45 10 H55 V65 C55 85 70 115 70 140 V287 C70 292 67 294 62 294 H38 C33 294 30 292 30 287 V140 C30 115 45 85 45 65 Z"
            fill={`url(#glass-${kind})`}
          />
        ) : specs.shoulderShape === 'sparkling' ? (
          // Botella Espumante: gollete ancho, hombros robustos
          <path
            d="M43 10 H57 V50 C57 70 76 95 76 122 V285 C76 290 71 294 65 294 H35 C29 294 24 290 24 285 V122 C24 95 43 70 43 50 Z"
            fill={`url(#glass-${kind})`}
          />
        ) : (
          // Botella Burdeos estándar: hombros marcados
          <path
            d="M44 10 H56 V60 C56 78 74 88 74 108 V285 C74 290 70 294 64 294 H36 C30 294 26 290 26 285 V108 C26 88 44 78 44 60 Z"
            fill={`url(#glass-${kind})`}
          />
        )}

        {/* Reflejo longitudinal izquierdo en el cuerpo */}
        <rect x="30" y="110" width="4" height="170" rx="2" fill="url(#specular-reflection)" />
        <rect x="36" y="112" width="1.5" height="166" fill="rgba(255,255,255,0.12)" />

        {/* Cápsula de cuello */}
        <path d="M43 8 H57 V48 H43 Z" fill={`url(#capsule-${kind})`} rx="1" />
        {/* Banda divisoria de cápsula */}
        <line x1="43" y1="46" x2="57" y2="46" stroke={specs.capsuleAccent} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="43" y1="12" x2="57" y2="12" stroke={specs.capsuleAccent} strokeWidth="0.8" strokeOpacity="0.5" />

        {/* ETIQUETA FRONTAL EDITORIAL */}
        <rect
          x="30"
          y="136"
          width="40"
          height="78"
          rx="1.5"
          fill={specs.labelBg}
          stroke={specs.labelBorder}
          strokeWidth="0.75"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
        />

        {/* Marco perimetral fino de la etiqueta */}
        <rect x="32" y="138" width="36" height="74" fill="none" stroke={specs.labelBorder} strokeWidth="0.35" strokeOpacity="0.6" />

        {/* Línea superior dorada */}
        <line x1="38" y1="144" x2="62" y2="144" stroke={specs.labelBorder} strokeWidth="0.5" />

        {/* Tipografía de etiqueta */}
        <text
          x="50"
          y="152"
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          letterSpacing="0.1em"
          fontFamily="serif"
          fill={specs.labelTextColor}
        >
          AYVINO
        </text>

        <text
          x="50"
          y="160"
          textAnchor="middle"
          fontSize="3.2"
          fontStyle="italic"
          fontFamily="serif"
          fill={specs.labelTextColor}
          opacity="0.85"
        >
          {specs.subLabel}
        </text>

        <line x1="44" y1="165" x2="56" y2="165" stroke={specs.labelBorder} strokeWidth="0.4" />

        <circle cx="50" cy="176" r="4.5" fill="none" stroke={specs.labelBorder} strokeWidth="0.4" />
        <path d="M48.5 174.5 H51.5 V176 H50 V178" stroke={specs.labelBorder} strokeWidth="0.5" strokeLinecap="round" />

        <text
          x="50"
          y="194"
          textAnchor="middle"
          fontSize="3"
          letterSpacing="0.12em"
          fontFamily="sans-serif"
          fontWeight="600"
          fill={specs.labelTextColor}
          opacity="0.7"
        >
          ARGENTINA
        </text>

        <text
          x="50"
          y="204"
          textAnchor="middle"
          fontSize="2.5"
          fontFamily="sans-serif"
          fill={specs.labelTextColor}
          opacity="0.55"
        >
          750 ML
        </text>
      </svg>
    </div>
  );
}

