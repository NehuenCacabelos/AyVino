import { ArrowLeft, Thermometer, Wine as WineGlass, Compass, Sparkles } from 'lucide-react';
import type { FoodPairingEntity, WineVarietyEntity } from '../../../data/pairingsData';

interface PairingDossierHeaderProps {
  mode: 'food' | 'wine';
  food?: FoodPairingEntity;
  wine?: WineVarietyEntity;
  sourceContext?: string | null;
  onClearSourceContext?: () => void;
}

export default function PairingDossierHeader({
  mode,
  food,
  wine,
  sourceContext,
  onClearSourceContext,
}: PairingDossierHeaderProps) {
  const isFood = mode === 'food';
  const title = isFood ? (food?.headline || food?.title) : (wine?.headline || wine?.title);
  const badgeLabel = isFood ? (food?.badge || '') : `${wine?.wineType || ''} · ${wine?.categoryGroup || ''}`;
  const sommelierNote = isFood ? food?.sommelierNote : wine?.sommelierNote;

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Badge contextual editorial si proviene de una sugerencia */}
      {sourceContext && (
        <div className="flex items-center gap-2 self-start px-3.5 py-1.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs font-sans animate-fadeIn">
          <span>Origen: <strong className="font-medium text-amber-100">{sourceContext}</strong></span>
          {onClearSourceContext && (
            <button
              type="button"
              onClick={onClearSourceContext}
              className="ml-1 text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Volver al maridaje previo"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>volver</span>
            </button>
          )}
        </div>
      )}

      {/* Cabecera Editorial Limpia */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-rose-300 font-semibold tracking-wider uppercase">
            Dossier del Sommelier
          </span>
          <span className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
            {badgeLabel}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-100 font-medium tracking-tight leading-tight">
          {title}
        </h2>

        <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-4xl font-light">
          {sommelierNote}
        </p>
      </div>

      {/* Barra de Métricas de Servicio: Transparente con divisores verticales sutiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-zinc-800/80 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 py-4 gap-y-4 sm:gap-y-0">
        {/* Celda 1: Temperatura */}
        <div className="px-3 sm:px-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Thermometer className="w-4 h-4 text-rose-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider">Temperatura</span>
          </div>
          <span className="font-serif text-base sm:text-lg font-semibold text-rose-100">
            {isFood ? food?.servingTemperature : wine?.servingTemperature}
          </span>
        </div>

        {/* Celda 2: Cristalería */}
        <div className="px-3 sm:px-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <WineGlass className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider">Copa Ideal</span>
          </div>
          <span
            className="font-serif text-base sm:text-lg font-semibold text-amber-200 truncate"
            title={isFood ? food?.glassware : wine?.glassware}
          >
            {isFood
              ? (food?.glassware ? `${food.glassware.split(' ')[0]} ${food.glassware.split(' ')[1] || ''}` : '')
              : wine?.glassware}
          </span>
        </div>

        {/* Celda 3: Principio o Estructura */}
        <div className="px-3 sm:px-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Compass className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
              {isFood ? 'Principio' : 'Cuerpo en Boca'}
            </span>
          </div>
          <span className="font-serif text-base sm:text-lg font-semibold text-zinc-100 truncate">
            {isFood ? food?.principle : wine?.body}
          </span>
        </div>

        {/* Celda 4: Afinidad / Acidez */}
        <div className="px-3 sm:px-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
              {isFood ? 'Afinidad Clave' : 'Nivel de Acidez'}
            </span>
          </div>
          <span className="font-sans text-xs sm:text-sm font-semibold text-amber-300 truncate">
            {isFood ? (food?.affinityNote || 'ALTA AFINIDAD') : wine?.acidity}
          </span>
        </div>
      </div>
    </div>
  );
}
