interface PairingWallpaperProps {
  mode: 'food' | 'wine';
}

/**
 * PairingWallpaper Component
 * Textura de fondo dinámica y editorial para la vista de Maridaje.
 * Alterna mediante un cross-fade suave entre motivos gastronómicos y enológicos.
 * Renderiza en capa z-0 sin máscaras obstructivas para asegurar visibilidad nítida.
 */
export default function PairingWallpaper({ mode }: PairingWallpaperProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Patrón Gastronómico (Modo Comida) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          mode === 'food' ? 'opacity-20' : 'opacity-0'
        }`}
      >
        <svg
          className="w-full h-full text-[#e8d5c4]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="food-pattern"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Motivo 1: Cubiertos cruzados de bistró (30, 30) */}
                <g transform="translate(30, 30)">
                  {/* Cuchillo */}
                  <path d="M-8,10 L4,-2 C6,-4 7,-8 4,-9 C2,-10 -1,-8 -3,-6 L-10,4 L-8,10 Z" />
                  {/* Tenedor */}
                  <path d="M10,10 L-2,-2 M-5,1 L1,-5 M-7,-1 L-1,-7 M-3,5 L3,-1" />
                </g>

                {/* Motivo 2: Cloche / Campana de plato (90, 30) */}
                <g transform="translate(90, 30)">
                  <path d="M-12,7 L12,7" />
                  <path d="M-10,7 C-10,-4 10,-4 10,7" />
                  <path d="M-2,-4 C-2,-6 2,-6 2,-4" />
                  <path d="M0,-8 Q1,-10 -1,-12" strokeWidth="1" />
                </g>

                {/* Motivo 3: Espiga de trigo (30, 90) */}
                <g transform="translate(30, 90)">
                  <line x1="0" y1="-16" x2="0" y2="16" />
                  <path d="M0,-12 C3,-14 6,-11 0,-8" />
                  <path d="M0,-12 C-3,-14 -6,-11 0,-8" />
                  <path d="M0,-6 C3,-8 6,-5 0,-2" />
                  <path d="M0,-6 C-3,-8 -6,-5 0,-2" />
                  <path d="M0,0 C3,-2 6,1 0,4" />
                  <path d="M0,0 C-3,-2 -6,1 0,4" />
                </g>

                {/* Motivo 4: Rama de romero / olivo (90, 90) */}
                <g transform="translate(90, 90)">
                  <path d="M-12,12 C-6,6 0,-2 8,-12" />
                  <path d="M-6,7 C-8,4 -4,3 -3,5" />
                  <path d="M-4,4 C-1,6 -1,10 -5,8" />
                  <path d="M-1,0 C-3,-3 1,-4 2,-2" />
                  <path d="M1,-3 C4,-2 4,2 0,1" />
                  <path d="M4,-7 C3,-10 7,-10 7,-7" />
                </g>

                {/* Motivo 5: Florón bistró central (60, 60) */}
                <path d="M60,54 L61.5,58.5 L66,60 L61.5,61.5 L60,66 L58.5,61.5 L54,60 L58.5,58.5 Z" />

                {/* Acentos de esquina */}
                <path d="M0,5 L1,1 L5,0 L1,-1 L0,-5 L-1,-1 L-5,0 L-1,1 Z" />
                <path d="M120,5 L121,1 L125,0 L121,-1 L120,-5 L119,-1 L115,0 L119,1 Z" />
                <path d="M0,125 L1,121 L5,120 L1,119 L0,115 L-1,119 L-5,120 L-1,121 Z" />
                <path d="M120,125 L121,121 L125,120 L121,119 L120,115 L119,119 L115,120 L119,121 Z" />
              </g>

              {/* Puntos geométricos discretos */}
              <circle cx="60" cy="15" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="60" cy="105" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="15" cy="60" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="105" cy="60" r="1.5" fill="currentColor" opacity="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#food-pattern)" />
        </svg>
      </div>

      {/* 2. Patrón Enológico (Modo Vino) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          mode === 'wine' ? 'opacity-20' : 'opacity-0'
        }`}
      >
        <svg
          className="w-full h-full text-[#e2c4c8]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="wine-pattern"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Motivo 1: Copa de cata sommelier (30, 30) */}
                <g transform="translate(30, 30)">
                  <path d="M-7,-12 L7,-12" />
                  <path d="M-7,-12 C-7,-1 7,-1 7,-12" />
                  <path d="M-5,-6 Q0,-4 5,-6" strokeWidth="1" />
                  <line x1="0" y1="-1" x2="0" y2="10" />
                  <line x1="-6" y1="10" x2="6" y2="10" />
                </g>

                {/* Motivo 2: Botella de vino con cápsula (90, 30) */}
                <g transform="translate(90, 30)">
                  {/* Cápsula / Corcho */}
                  <path d="M-2,-14 L2,-14 L2,-11 L-2,-11 Z" />
                  {/* Cuello y Hombro */}
                  <path d="M-1,-11 L-1,-6 L-4,-1 L-4,13 L4,13 L4,-1 L1,-6 L1,-11" />
                  <line x1="-4" y1="13" x2="4" y2="13" />
                  {/* Línea de etiqueta */}
                  <line x1="-4" y1="3" x2="4" y2="3" strokeWidth="1" />
                  <line x1="-4" y1="8" x2="4" y2="8" strokeWidth="1" />
                </g>

                {/* Motivo 3: Racimo de uvas y zarcillo (30, 90) */}
                <g transform="translate(30, 90)">
                  {/* Tallo y hoja de vid */}
                  <path d="M0,-14 L0,-9" />
                  <path d="M0,-13 C3,-17 8,-15 5,-11 C2,-9 1,-11 0,-12" />
                  {/* Granos de uva */}
                  <circle cx="-4" cy="-5" r="2.8" />
                  <circle cx="4" cy="-5" r="2.8" />
                  <circle cx="0" cy="-5" r="2.8" />
                  <circle cx="-2" cy="0" r="2.8" />
                  <circle cx="2" cy="0" r="2.8" />
                  <circle cx="0" cy="5" r="2.5" />
                  <circle cx="0" cy="9.5" r="2" />
                </g>

                {/* Motivo 4: Sacacorchos de bodega (90, 90) */}
                <g transform="translate(90, 90)">
                  {/* Mango en T */}
                  <path d="M-8,-12 C-8,-14 8,-14 8,-12 L8,-10 C8,-9 -8,-9 -8,-10 Z" />
                  <line x1="0" y1="-10" x2="0" y2="-4" />
                  {/* Espiral tirabuzón */}
                  <path d="M0,-4 C-3,-2 3,0 0,2 C-3,4 3,6 0,8 C-3,10 3,12 0,14" />
                </g>

                {/* Motivo 5: Florón viñedo central (60, 60) */}
                <path d="M60,54 L61.5,58.5 L66,60 L61.5,61.5 L60,66 L58.5,61.5 L54,60 L58.5,58.5 Z" />

                {/* Acentos de esquina */}
                <path d="M0,5 L1,1 L5,0 L1,-1 L0,-5 L-1,-1 L-5,0 L-1,1 Z" />
                <path d="M120,5 L121,1 L125,0 L121,-1 L120,-5 L119,-1 L115,0 L119,1 Z" />
                <path d="M0,125 L1,121 L5,120 L1,119 L0,115 L-1,119 L-5,120 L-1,121 Z" />
                <path d="M120,125 L121,121 L125,120 L121,119 L120,115 L119,119 L115,120 L119,121 Z" />
              </g>

              {/* Puntos geométricos discretos */}
              <circle cx="60" cy="15" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="60" cy="105" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="15" cy="60" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="105" cy="60" r="1.5" fill="currentColor" opacity="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wine-pattern)" />
        </svg>
      </div>
    </div>
  );
}
