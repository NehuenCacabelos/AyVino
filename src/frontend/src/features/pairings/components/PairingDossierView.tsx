import { Link } from 'react-router-dom';
import { ArrowUpRight, AlertCircle, Sparkles, Check, X } from 'lucide-react';
import type {
  WineVarietyEntry,
  DishPairingEntry,
  FoodFamilyInfo,
  WineStyleProfile,
  WitnessBottle,
  PairingLink,
} from '../../../data/pairingsData';

interface PairingDossierViewProps {
  mode: 'wine' | 'food';
  wine?: WineVarietyEntry;
  dish?: DishPairingEntry | FoodFamilyInfo;
  styleAnchor?: string | null;
  sourceContext?: string | null;
  onClearSourceContext?: () => void;
  onSelectWine: (id: string, anchor?: string, fromLabel?: string) => void;
  onSelectFood: (id: string, fromLabel?: string) => void;
}


/**
 * WitnessBottleList Component
 * Renderiza la lista tipográfica secundaria monospaciada de etiquetas reales del catálogo.
 */
function WitnessBottleList({ bottles }: { bottles: WitnessBottle[] }) {
  if (!bottles || bottles.length === 0) return null;

  return (
    <div className="pt-4 border-t border-neutral-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium">
          Etiquetas Testigo en Catálogo ({bottles.length})
        </h4>
        <span className="text-[10px] font-mono text-neutral-500">
          Añada / Bodega / Terruño
        </span>
      </div>

      <div className="divide-y divide-neutral-900 border-y border-neutral-800/60 font-mono text-xs">
        {bottles.map((bottle) => (
          <div
            key={`${bottle.winery}-${bottle.label}`}
            className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-300 group"
          >
            <div className="flex items-center gap-2">
              {bottle.vintage && (
                <span className="text-neutral-500 font-normal">{bottle.vintage}</span>
              )}
              <span className="text-neutral-200 font-medium group-hover:text-amber-200 transition-colors">
                {bottle.label}
              </span>
              <span className="text-neutral-500 text-[11px]">· {bottle.winery}</span>
            </div>

            <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
              <span>{bottle.region}</span>
              {bottle.catalogWineId && (
                <Link
                  to={`/catalogo?q=${encodeURIComponent(bottle.winery)}`}
                  className="inline-flex items-center gap-0.5 text-rose-300 hover:text-white transition-colors"
                  title="Ver en catálogo de AyVino"
                >
                  <span>Explorar</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SuggestionsGrid Component
 * Renderiza las sugerencias de Afinidad, Contraste y Alertas de Choque.
 * Utiliza hipertexto tipográfico interactivo para pivotar entre modos.
 */
function SuggestionsGrid({
  affinities,
  contrasts,
  clashes,
  mode,
  currentName,
  onSelectWine,
  onSelectFood,
}: {
  affinities: PairingLink[];
  contrasts: PairingLink[];
  clashes: { target: string; reason: string }[];
  mode: 'wine' | 'food';
  currentName: string;
  onSelectWine: (id: string, anchor?: string, fromLabel?: string) => void;
  onSelectFood: (id: string, fromLabel?: string) => void;
}) {
  const handleClickLink = (link: PairingLink) => {
    if (mode === 'wine') {
      onSelectFood(link.id, currentName);
    } else {
      onSelectWine(link.id, link.styleAnchor, currentName);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
      {/* 1. AFINIDAD */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-semibold block">
          Afinidad (Espejo Organoléptico)
        </span>
        <ul className="space-y-1.5 text-sm">
          {affinities.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="text-left text-neutral-200 hover:text-rose-200 hover:underline transition-colors font-sans cursor-pointer group flex items-start gap-1.5"
              >
                <span className="text-rose-400/80 text-xs mt-0.5 select-none">↳</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. CONTRASTE */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-semibold block">
          Contraste (Corte & Balance)
        </span>
        <ul className="space-y-1.5 text-sm">
          {contrasts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="text-left text-neutral-200 hover:text-amber-200 hover:underline transition-colors font-sans cursor-pointer group flex items-start gap-1.5"
              >
                <span className="text-amber-400/80 text-xs mt-0.5 select-none">↳</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. QUÉ EVITAR */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-semibold block">
          Combinaciones a Evitar (Choques)
        </span>
        <ul className="space-y-2 text-xs">
          {clashes.map((clash) => (
            <li key={clash.target} className="text-neutral-400 leading-snug">
              <strong className="text-neutral-200 font-medium block">
                {clash.target}
              </strong>
              <span className="text-[11px] text-neutral-400 italic">
                ({clash.reason})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * PairingDossierView Component
 * Ficha tipográfica integral de Maridaje (Modo Cepa y Modo Plato).
 * Sigue la estética editorial de WineDetailPage: texto estructurado, líneas sobrias,
 * cero cards infladas.
 */
export default function PairingDossierView({
  mode,
  wine,
  dish,
  styleAnchor,
  sourceContext,
  onClearSourceContext,
  onSelectWine,
  onSelectFood,
}: PairingDossierViewProps) {
  // -------------------------------------------------------------
  // MODO PLATO
  // -------------------------------------------------------------
  if (mode === 'food' && dish) {
    return (
      <article className="space-y-8 animate-fadeIn">
        {/* Procedencia tipográfica */}
        {sourceContext && (
          <div className="flex items-center justify-between text-xs font-mono text-amber-300/90 py-1.5 border-b border-neutral-800/80">
            <span>Sugerencia derivada desde: "{sourceContext}"</span>
            {onClearSourceContext && (
              <button
                type="button"
                onClick={onClearSourceContext}
                className="hover:text-white transition-colors cursor-pointer text-[11px] uppercase tracking-wider flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        )}

        {/* Encabezado de la Comida / Plato */}
        <header className="space-y-2">
          <div className="text-xs font-mono tracking-widest text-amber-300/90 uppercase font-semibold">
            {'familyId' in dish ? 'Plato Específico' : 'Recomendación por Categoría Gastronómica'}
          </div>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
            {dish.name}
          </h2>
          <p className="text-base text-neutral-300 font-sans max-w-3xl leading-relaxed">
            {dish.tagline}
          </p>
        </header>

        {/* Tira de Especificaciones de Servicio (Espejo de WineDetailPage) */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-3 border-y border-neutral-800/80">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
              Temperatura Servicio Copa
            </span>
            <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
              {dish.servingTemperature}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
              Cristalería Recomendada
            </span>
            <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
              {dish.glassware}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
              Tip del Sommelier
            </span>
            <span className="text-sm font-normal text-neutral-300 font-sans">
              {dish.serviceTip}
            </span>
          </div>
        </div>

        {/* Fundamento Enogastronómico */}
        <section className="space-y-2">
          <h3 className="text-xs font-mono tracking-widest uppercase text-neutral-400 font-medium">
            Fundamento Químico y Organoléptico
          </h3>
          <p className="font-serif text-base sm:text-lg text-neutral-200 leading-relaxed font-light italic max-w-4xl">
            "{dish.chemicalRationale}"
          </p>
        </section>

        {/* Sugerencias de Armonización */}
        <section className="space-y-3 pt-2 border-t border-neutral-800/80">
          <h3 className="text-xs font-mono tracking-widest uppercase text-neutral-400 font-medium">
            Armonizaciones Enológicas Sugeridas
          </h3>
          <SuggestionsGrid
            affinities={dish.affinities}
            contrasts={dish.contrasts}
            clashes={dish.clashes}
            mode="food"
            currentName={dish.name}
            onSelectWine={onSelectWine}
            onSelectFood={onSelectFood}
          />
        </section>

        {/* Etiquetas Testigo en Catálogo */}
        <WitnessBottleList bottles={dish.witnessBottles} />
      </article>
    );
  }

  // -------------------------------------------------------------
  // MODO CEPA
  // -------------------------------------------------------------
  if (mode === 'wine' && wine) {
    const hasMultipleStyles = wine.styles.length > 1;

    return (
      <article className="space-y-8 animate-fadeIn">
        {/* Procedencia tipográfica */}
        {sourceContext && (
          <div className="flex items-center justify-between text-xs font-mono text-rose-300/90 py-1.5 border-b border-neutral-800/80">
            <span>Sugerencia derivada desde: "{sourceContext}"</span>
            {onClearSourceContext && (
              <button
                type="button"
                onClick={onClearSourceContext}
                className="hover:text-white transition-colors cursor-pointer text-[11px] uppercase tracking-wider flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        )}

        {/* Encabezado de la Cepa */}
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-rose-300 uppercase font-semibold">
            <span>Varietal Insignia</span>
            {wine.originNote && (
              <>
                <span className="text-neutral-600" aria-hidden="true">·</span>
                <span className="text-neutral-400 font-normal">{wine.originNote}</span>
              </>
            )}
          </div>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
            {wine.name}
          </h2>
          <p className="text-base text-neutral-300 font-sans max-w-3xl leading-relaxed">
            {wine.tagline}
          </p>
        </header>

        {/* Sub-estilos enológicos (Bifurcaciones tipográficas) */}
        <div className="space-y-10">
          {wine.styles.map((style: WineStyleProfile, index: number) => {
            const isAnchorMatched = styleAnchor === style.styleId;

            return (
              <section
                key={style.styleId}
                id={`style-${style.styleId}`}
                className={`space-y-6 ${
                  index > 0 ? 'pt-8 border-t border-neutral-800/80' : ''
                } ${isAnchorMatched ? 'bg-rose-950/10 p-4 rounded-sm border border-rose-900/40' : ''}`}
              >
                {/* Cabecera del sub-estilo si hay multiplicidad */}
                {hasMultipleStyles && (
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-rose-200 font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" aria-hidden="true" />
                      <span>{style.styleName}</span>
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Estilo {index + 1} de {wine.styles.length}
                    </span>
                  </div>
                )}

                {/* Tira de Especificaciones de Servicio y Perfil */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-3 border-y border-neutral-800/80">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                      Temperatura Óptima
                    </span>
                    <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                      {style.servingTemperature}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                      Copa de Servicio
                    </span>
                    <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                      {style.glassware}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                      Acidez
                    </span>
                    <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                      {style.acidity}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                      Cuerpo
                    </span>
                    <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                      {style.body}
                    </span>
                  </div>

                  {style.tannins && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                        Taninos
                      </span>
                      <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                        {style.tannins}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                      Tip de Servicio
                    </span>
                    <span className="text-sm font-normal text-neutral-300 font-sans">
                      {style.serviceTip}
                    </span>
                  </div>
                </div>

                {/* Fundamento Enogastronómico */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono tracking-widest uppercase text-neutral-400 font-medium">
                    Fundamento Químico y Organoléptico
                  </h4>
                  <p className="font-serif text-base sm:text-lg text-neutral-200 leading-relaxed font-light italic max-w-4xl">
                    "{style.chemicalRationale}"
                  </p>
                </div>

                {/* Sugerencias de Armonización */}
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  <h4 className="text-xs font-mono tracking-widest uppercase text-neutral-400 font-medium">
                    Armonizaciones Gastronómicas Sugeridas
                  </h4>
                  <SuggestionsGrid
                    affinities={style.affinities}
                    contrasts={style.contrasts}
                    clashes={style.clashes}
                    mode="wine"
                    currentName={wine.name}
                    onSelectWine={onSelectWine}
                    onSelectFood={onSelectFood}
                  />
                </div>

                {/* Etiquetas Testigo en Catálogo */}
                <WitnessBottleList bottles={style.witnessBottles} />
              </section>
            );
          })}
        </div>
      </article>
    );
  }

  return null;
}

