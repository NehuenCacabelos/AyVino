import { useState } from 'react';
import { Flame, Scale, AlertTriangle } from 'lucide-react';
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

type MobileTab = 'affinity' | 'contrast' | 'avoid';

/**
 * WineFoodPairingSection Component
 * Cuaderno Enogastronómico — Grid Editorial de 3 columnas para Maridajes Gastronómicos:
 * - Columna A: Afinidad — Espejo Organoléptico (Tarjeta fotográfica + Secundarias)
 * - Columna B: Contraste — Corte & Balance (Tarjeta fotográfica + Secundarias)
 * - Columna C: Combinaciones a Evitar (Alertas Químicas Sommelier con enlaces alternativos)
 * - En Mobile/Tablet (< lg): Selector de pestañas interactivas tipo pill para navegación limpia.
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

  const featuredAffinity = affinities.find((a) => a.isFeatured) ?? affinities[0];
  const secondaryAffinities = affinities.filter((a) => a.id !== featuredAffinity?.id);

  const featuredContrast = contrasts.find((c) => c.isFeatured) ?? contrasts[0];
  const secondaryContrasts = contrasts.filter((c) => c.id !== featuredContrast?.id);

  // Renderizador de Columna A (Afinidad)
  const renderAffinityColumn = () => (
    <div className="flex flex-col space-y-4 p-4 sm:p-5 rounded-2xl bg-[#141315] border border-white/[0.06] shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-[#ffb2b8]">
          <Flame className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs tracking-widest uppercase font-bold text-white">
            Afinidad — Espejo
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
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

  // Renderizador de Columna B (Contraste)
  const renderContrastColumn = () => (
    <div className="flex flex-col space-y-4 p-4 sm:p-5 rounded-2xl bg-[#141315] border border-white/[0.06] shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Scale className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs tracking-widest uppercase font-bold text-white">
            Contraste — Corte
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-amber-950/80 text-amber-300 border border-amber-500/30">
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

  // Renderizador de Columna C (Alertas Químicas)
  const renderAvoidColumn = () => (
    <div className="flex flex-col space-y-4 p-4 sm:p-5 rounded-2xl bg-[#141315] border border-white/[0.06] shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span className="font-mono text-xs tracking-widest uppercase font-bold text-rose-400">
            Combinaciones a Evitar
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-rose-950/80 text-rose-300 border border-rose-500/30">
          Alerta Química
        </span>
      </div>

      <div className="space-y-3">
        {clashes.map((clash) => (
          <PairingAlertCard
            key={clash.target}
            clash={clash}
            onSelectWine={onSelectWine}
          />
        ))}
      </div>
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
          crujientes y las alertas para evitar choques indeseados en boca.
        </p>
      </div>

      {/* Tabs Selector para Mobile y Tablet (< lg) */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Categorías de Maridaje"
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'affinity'}
            onClick={() => setActiveTab('affinity')}
            className={`py-2 px-2 rounded-lg font-mono text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`py-2 px-2 rounded-lg font-mono text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'contrast'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contraste</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'avoid'}
            onClick={() => setActiveTab('avoid')}
            className={`py-2 px-2 rounded-lg font-mono text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'avoid'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Evitar</span>
          </button>
        </div>

        {/* Vista Móvil: contenido de la pestaña activa */}
        <div className="mt-4">
          {activeTab === 'affinity' && renderAffinityColumn()}
          {activeTab === 'contrast' && renderContrastColumn()}
          {activeTab === 'avoid' && renderAvoidColumn()}
        </div>
      </div>

      {/* Grid Desktop Completo de 3 Columnas (>= lg) */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
        {renderAffinityColumn()}
        {renderContrastColumn()}
        {renderAvoidColumn()}
      </div>
    </section>
  );
}

export default WineFoodPairingSection;

