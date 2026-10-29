import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Check, ArrowRight, Lightbulb } from 'lucide-react';

interface PairingCavaActionProps {
  serviceTip: string;
}

export default function PairingCavaAction({ serviceTip }: PairingCavaActionProps) {
  const [savedToCava, setSavedToCava] = useState(false);

  const handleSaveToCava = () => {
    setSavedToCava(true);
  };

  // Limpieza del temporizador con cleanup conforme a la Regla 9 de ciclo de vida
  useEffect(() => {
    if (!savedToCava) return;

    const timer = setTimeout(() => {
      setSavedToCava(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [savedToCava]);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 shadow-sm">
      {/* Consejo del Sommelier */}
      <div className="flex items-start gap-3 flex-1">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
            Consejo del Sommelier
          </span>
          <p className="font-sans text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
            {serviceTip}
          </p>
        </div>
      </div>

      {/* Botones de Acción en rounded-lg */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={handleSaveToCava}
          className={`px-4 py-2 rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border ${
            savedToCava
              ? 'bg-amber-400 text-neutral-950 font-semibold border-amber-400 shadow-md shadow-amber-400/20'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-neutral-200 border-zinc-700 hover:border-zinc-500 shadow-sm'
          }`}
        >
          {savedToCava ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Guardado en Cava</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-rose-300" />
              <span>Guardar Ficha</span>
            </>
          )}
        </button>

        <Link
          to="/catalogo"
          className="px-4 py-2 rounded-lg bg-[#4f131f] hover:bg-[#5e1725] text-rose-100 border border-rose-400/20 text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Catálogo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
