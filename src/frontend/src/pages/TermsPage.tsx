import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wine } from 'lucide-react';

/**
 * TermsPage Component
 * Vista provisional de Términos y Condiciones (/terms).
 * Mantiene la estética editorial sobria de cava oscura de AyVino.
 */
export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-[#6b1d2f] selection:text-white">
      {/* Tarjeta Central Flotante */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl shadow-black/80 flex flex-col items-center">
        {/* Header con botón Volver */}
        <div className="w-full flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver</span>
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-serif text-lg font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
              AyVino
            </span>
            <div className="w-7 h-7 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center text-rose-300 group-hover:border-[#6b1d2f] transition-colors shadow-sm">
              <Wine className="w-3.5 h-3.5 text-rose-300" strokeWidth={1.8} />
            </div>
          </Link>
        </div>

        {/* Contenido Central */}
        <div className="my-6 space-y-3">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-zinc-100 tracking-tight">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
            Próximamente los términos y condiciones de AyVino.
          </p>
        </div>

        {/* Footer / Nota sutil */}
        <div className="mt-6 pt-6 border-t border-white/5 w-full text-center">
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
            Edición Cava 2026 · Valle de Uco
          </p>
        </div>
      </div>
    </div>
  );
}

