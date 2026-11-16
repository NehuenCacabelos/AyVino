import { useState } from 'react';
import { Flame, Scale, AlertTriangle, ChevronDown } from 'lucide-react';
import type {
  EnrichedFoodRecommendation,
  EnrichedChemicalClash,
} from '../../../data/pairingsData';
import { FeaturedPairingCard } from './FeaturedPairingCard';
import { SecondaryPairingCard } from './SecondaryPairingCard';
import { PairingAlertCard } from './PairingAlertCard';

interface WineFoodPairingSectionProps {
  affinities: EnrichedFoodRecommendation[];
  contrasts: EnrichedFoodRecommendation[];
  clashes: EnrichedChemicalClash[];
  wineName: string;
  onSelectWine: (id: string, anchor?: string, fromLabel?: string) => void;
  onSelectFood: (id: string, fromLabel?: string) => void;
}

type MobileTab = 'affinity' | 'contrast';

/**
 * WineFoodPairingSection Component
 * Cuaderno Enogastronómico — Grid Editorial Simétrico de 2 columnas para Maridajes:
 * - Columna 1: Afinidad — Espejo Organoléptico (Plato principal + Secundarias)
 * - Columna 2: Contraste — Corte & Balance (Plato principal + Secundarias)
 * - Al pie: Bloque horizontal colapsable (Accordion) para Alertas Químicas / Combinaciones a Evitar.
 * - Mobile: Selector de pestañas binario (Afinidad / Contraste) para navegación limpia.
 */
export function WineFoodPairingSection({
  affinities,
  contrasts,
  clashes,
  wineName,
  onSelectWine,
  onSelectFood,
}: WineFoodPairingSectionProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('affinity');
  const [isAvoidOpen, setIsAvoidOpen] = useState(false);

  const featuredAffinity = affinities.find((a) => a.isFeatured) ?? affinities[0];
  const secondaryAffinities = affinities.filter((a) => a.id !== featuredAffinity?.id);

  const featuredContrast = contrasts.find((c) => c.isFeatured) ?? contrasts[0];
  const secondaryContrasts = contrasts.filter((c) => c.id !== featuredContrast?.id);

  // Renderizador de Columna 1 (Afinidad) — Sin card exterior pesada
  const renderAffinityColumn = () => (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs tracking-widest uppercase font-bold text-white block">
              Afinidad — Espejo
            </span>
            <span className="text-[11px] text-zinc-400 font-sans block">
              Armonía organoléptica por similitud y resonancia
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono tracking-widest uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shrink-0">
          Prioridad Máxima
        </span>
      </div>

      {featuredAffinity && (
        <FeaturedPairingCard
          item={featuredAffinity}
          wineName={wineName}
          onSelectFood={onSelectFood}
          variant="affinity"
        />
      )}

      {secondaryAffinities.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {secondaryAffinities.map((item) => (
            <SecondaryPairingCard
              key={item.id}
              item={item}
              wineName={wineName}
              onSelectFood={onSelectFood}
              variant="affinity"
            />
          ))}
        </div>
      )}
    </div>
  );

  // Renderizador de Columna 2 (Contraste) — Sin card exterior pesada
  const renderContrastColumn = () => (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs tracking-widest uppercase font-bold text-white block">
              Contraste — Corte
            </span>
            <span className="text-[11px] text-zinc-400 font-sans block">
              Tensión dinámica, acidez limpiadora y contrapunto
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono tracking-widest uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0">
          Equilibrio
        </span>
      </div>

      {featuredContrast && (
        <FeaturedPairingCard
          item={featuredContrast}
          wineName={wineName}
          onSelectFood={onSelectFood}
          variant="contrast"
        />
      )}

      {secondaryContrasts.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {secondaryContrasts.map((item) => (
            <SecondaryPairingCard
              key={item.id}
              item={item}
              wineName={wineName}
              onSelectFood={onSelectFood}
              variant="contrast"
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section
      aria-label="Armonizaciones Gastronómicas Sugeridas"
      className="space-y-6 pt-2"
    >
      {/* Cabecera Editorial de la Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#fbbf24] font-bold block mb-1">
            Carta Sommelier
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl text-white font-semibold tracking-tight">
            Armonizaciones Gastronómicas Sugeridas
          </h3>
        </div>
        <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
          Explorá la interacción entre las proteínas asadas a la leña, las texturas
          crujientes y el balance organoléptico de cada copa.
        </p>
      </div>

      {/* Tabs Selector para Mobile y Tablet (< lg) */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Categorías de Maridaje"
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'affinity'}
            onClick={() => setActiveTab('affinity')}
            className={`py-2 px-3 rounded-lg font-mono text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'affinity'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Afinidad</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'contrast'}
            onClick={() => setActiveTab('contrast')}
            className={`py-2 px-3 rounded-lg font-mono text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'contrast'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contraste</span>
          </button>
        </div>

        {/* Vista Móvil: contenido de la pestaña activa */}
        <div className="mt-4">
          {activeTab === 'affinity' && renderAffinityColumn()}
          {activeTab === 'contrast' && renderContrastColumn()}
        </div>
      </div>

      {/* Grid Desktop Completo de 2 Columnas Simétricas (>= lg) */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
        {renderAffinityColumn()}
        {renderContrastColumn()}
      </div>

      {/* Bloque / Accordion Colapsable Horizontal: Combinaciones a Evitar */}
      {clashes.length > 0 && (
        <div className="pt-2">
          <div className="rounded-xl border border-rose-950/60 bg-[#161314]/80 backdrop-blur-sm overflow-hidden transition-all duration-300">
            <button
              type="button"
              onClick={() => setIsAvoidOpen((prev) => !prev)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-rose-950/20 transition-colors cursor-pointer focus:outline-none"
              aria-expanded={isAvoidOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-950/70 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-rose-300">
                      Combinaciones desaconsejadas para este estilo
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-500/30">
                      {clashes.length} {clashes.length === 1 ? 'alerta' : 'alertas'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5 truncate">
                    Factores moleculares y choques bioquímicos que desequilibran este varietal en boca
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline text-zinc-400">
                  {isAvoidOpen ? 'Ocultar' : 'Ver alertas'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isAvoidOpen ? 'rotate-180 text-rose-400' : ''
                  }`}
                />
              </div>
            </button>

            {isAvoidOpen && (
              <div className="px-5 pb-5 pt-3 border-t border-white/[0.05] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clashes.map((clash) => (
                  <PairingAlertCard
                    key={clash.target}
                    clash={clash}
                    onSelectWine={onSelectWine}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default WineFoodPairingSection;

