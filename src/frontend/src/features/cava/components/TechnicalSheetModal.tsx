import { X, Award, Mountain, Sparkles } from 'lucide-react';
import BottleVector from '../../dashboard/components/BottleVector';
import type { CellarWine } from '../types';

interface TechnicalSheetModalProps {
  wine: CellarWine | null;
  onClose: () => void;
  onUncork: (wine: CellarWine) => void;
}

export default function TechnicalSheetModal({
  wine,
  onClose,
  onUncork,
}: TechnicalSheetModalProps) {
  if (!wine) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#fbbf24] tracking-widest uppercase">
              Ficha Técnica Enológica
            </span>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-[11px] text-neutral-400">{wine.location}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Top Hero Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative w-36 h-56 rounded-xl bg-[#0a0a0c] border border-neutral-800 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(114,47,55,0.25)_0%,_transparent_75%)]" />
              {wine.imageUrl ? (
                <img
                  src={wine.imageUrl}
                  alt={wine.name}
                  className="h-48 w-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
                />
              ) : (
                <BottleVector kind={wine.bottle} className="h-48 w-auto relative z-10" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="font-mono text-xs text-[#ffb2b8] tracking-wider uppercase font-semibold">
                  {wine.winery} · {wine.region}
                </span>
                {wine.criticBadge && (
                  <span className="bg-[#201f25] border border-[#fbbf24]/30 px-2 py-0.5 rounded text-[#fbbf24] font-mono text-xs font-bold">
                    {wine.criticBadge}
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold leading-tight">
                {wine.name}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                {wine.terroirNote || `${wine.varietal} de partida exclusiva.`}
              </p>

              {/* Badges of Vitals */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-left">
                <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                  <span className="font-mono text-[9px] text-neutral-400 block uppercase">Añada</span>
                  <span className="font-serif text-sm text-neutral-200 font-medium">{wine.vintage}</span>
                </div>
                <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                  <span className="font-mono text-[9px] text-neutral-400 block uppercase">Graduación</span>
                  <span className="font-serif text-sm text-neutral-200 font-medium">{wine.alcoholContent || '14.5% ABV'}</span>
                </div>
                <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80 col-span-2 sm:col-span-1">
                  <span className="font-mono text-[9px] text-neutral-400 block uppercase">Custodia</span>
                  <span className="font-serif text-sm text-[#fbbf24] font-medium">{wine.temperatureConst || '15°C Constante'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terroir & Agronomic Specifications */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs text-neutral-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#fbbf24]" />
              Terroir &amp; Crianza en Bodega
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1">
                <span className="font-mono text-[10px] text-neutral-400 uppercase block">Altitud &amp; Clima</span>
                <p className="text-neutral-200">{wine.altitude || '1.200 - 1.450 msnm. Gran amplitud térmica.'}</p>
              </div>
              <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1">
                <span className="font-mono text-[10px] text-neutral-400 uppercase block">Composición del Suelo</span>
                <p className="text-neutral-200">{wine.soilType || 'Aluvional con horizonte calcáreo y gravas profundas.'}</p>
              </div>
              <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1 sm:col-span-2">
                <span className="font-mono text-[10px] text-neutral-400 uppercase block">Régimen de Roble</span>
                <p className="text-neutral-200">{wine.oakAging || '18 meses en barricas de roble francés nuevo y de segundo uso.'}</p>
              </div>
            </div>
          </div>

          {/* Tasting Notes Matrix */}
          {wine.tastingNotes && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs text-neutral-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
                Notas Sensoriales de Cata
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                  <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                    Fase Visual
                  </span>
                  <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.sight}</p>
                </div>
                <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                  <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                    Fase Olfativa
                  </span>
                  <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.nose}</p>
                </div>
                <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                  <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                    Fase Gustativa
                  </span>
                  <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.mouth}</p>
                </div>
                <div className="p-3 bg-[#722F37]/15 rounded-lg border border-[#722F37]/35">
                  <span className="font-mono text-[10px] text-[#ffb2b8] uppercase block font-semibold mb-0.5">
                    Maridaje Sugerido
                  </span>
                  <p className="text-neutral-200 leading-relaxed">{wine.tastingNotes.pairing}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-[#0c0c0e] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUncork(wine);
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all"
          >
            <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Registrar Cata / Descorchar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
