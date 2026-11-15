import { useEffect } from 'react';
import { X } from 'lucide-react';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CommunityModal Component
 * Modal sobrio y editorial de "Próximamente" para la sección de Comunidad.
 * Tipografía Serif noble, gráfico minimalista de líneas finas y texto explicativo.
 */
export default function CommunityModal({ isOpen, onClose }: CommunityModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-[#141416] border border-neutral-800 p-8 rounded-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gráfico minimalista en SVG de líneas finas (Copas y mesa comunitaria) */}
        <div className="flex justify-center mb-6">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-14 h-14 text-neutral-400 stroke-current"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Copa 1 */}
            <path d="M22 18C22 25 28 29 28 36H24M28 36H32M28 36V46M20 46H36" />
            <path d="M16 18H34" />
            <path d="M16 18C16 26 22 30 25 32" strokeDasharray="1 2" opacity="0.6" />

            {/* Copa 2 (Brindis sutil en perspectiva) */}
            <path d="M42 22C42 28 37 32 37 38H41M37 38H33M37 38V46M30 46H44" />
            <path d="M35 22H49" />

            {/* Línea horizontal de mesa de cata */}
            <line x1="8" y1="52" x2="56" y2="52" className="stroke-neutral-700" strokeWidth="1" />
            <line x1="16" y1="52" x2="16" y2="58" className="stroke-neutral-800" strokeWidth="1" />
            <line x1="48" y1="52" x2="48" y2="58" className="stroke-neutral-800" strokeWidth="1" />
          </svg>
        </div>

        {/* Eyebrow editorial plano */}
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium mb-2">
          Espacio de Comunidad · Próximamente
        </p>

        {/* Título en Serif */}
        <h3 className="font-serif text-2xl font-semibold text-neutral-100 leading-tight mb-3">
          Catas compartidas y clubes locales
        </h3>

        {/* Explicación sobria */}
        <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed max-w-sm mx-auto mb-6">
          Estamos diseñando el espacio de catas compartidas y clubes enológicos locales. Pronto vas a poder conectar con otros amantes del vino, coordinar descorches y compartir botellas singulares de tu región.
        </p>

        {/* Acción sobria */}
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-sm bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          Entendido
        </button>

      </div>
    </div>
  );
}

