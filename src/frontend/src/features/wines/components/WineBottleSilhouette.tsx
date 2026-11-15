interface WineBottleSilhouetteProps {
  className?: string;
}

/**
 * WineBottleSilhouette Component
 * Silueta vectorial sobria y minimalista en trazo fino para fallback de botellas sin imagen.
 * Sin clichés de IA, sin degradados estridentes ni elementos caricaturescos.
 */
export default function WineBottleSilhouette({ className = 'w-16 h-40' }: WineBottleSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 64 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tapón / Cápsula superior */}
      <rect x="27" y="6" width="10" height="18" rx="1" className="fill-neutral-800 stroke-neutral-700" strokeWidth="1" />
      <line x1="26" y1="12" x2="38" y2="12" className="stroke-neutral-700" strokeWidth="0.8" />
      
      {/* Cuello de la botella */}
      <path
        d="M27 24V50C27 60 16 68 16 80V148C16 151.314 18.6863 154 22 154H42C45.3137 154 48 151.314 48 148V80C48 68 37 60 37 50V24"
        className="fill-neutral-900/80 stroke-neutral-700"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Etiqueta minimalista sobria en el cuerpo */}
      <rect
        x="21"
        y="84"
        width="22"
        height="38"
        rx="1"
        className="fill-neutral-800/90 stroke-neutral-700"
        strokeWidth="0.8"
      />
      {/* Líneas sutiles simulando tipografía de etiqueta */}
      <line x1="25" y1="94" x2="39" y2="94" className="stroke-neutral-600" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="27" y1="100" x2="37" y2="100" className="stroke-neutral-700" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="29" y1="106" x2="35" y2="106" className="stroke-neutral-700" strokeWidth="0.8" strokeLinecap="round" />

      {/* Reflejo longitudinal fino */}
      <path
        d="M20 86V144"
        className="stroke-neutral-700/40"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

