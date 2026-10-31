import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, X } from 'lucide-react';
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

// ─── Constantes de estilo ─────────────────────────────────────────────────────
const LABEL_CLS =
  'text-[11px] uppercase tracking-wider text-zinc-500 font-medium block';

// ─── Imagen de cabecera con badge superpuesto ─────────────────────────────────
function DossierImage({
  src,
  alt,
  badge,
}: {
  src: string;
  alt: string;
  badge?: string;
}) {
  return (
    <div className="w-full md:w-56 lg:w-64 aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 shrink-0 shadow-lg relative group">
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full grayscale-[20%] contrast-[1.05] group-hover:grayscale-0 transition-all duration-500"
        loading="lazy"
      />
      {badge && (
        <span className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-300 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10 select-none">
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Celda de la grilla técnica ───────────────────────────────────────────────
function SpecCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={LABEL_CLS}>{label}</span>
      <span
        className={`text-sm font-semibold text-neutral-200 mt-0.5 ${
          mono ? 'font-mono' : 'font-sans'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Bloque editorial unificado: Tip + Fundamento ────────────────────────────
function EditorialBlock({
  tip,
  rationale,
}: {
  tip: string;
  rationale: string;
}) {
  return (
    <div className="my-6 p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3 max-w-3xl">
      <div className="flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <span className={`${LABEL_CLS} text-amber-400/80 mb-1`}>
            Tip del Sommelier
          </span>
          <p className="text-sm text-zinc-200 font-sans leading-relaxed">{tip}</p>
        </div>
      </div>
      <div className="border-t border-zinc-800/60 pt-3">
        <span className={`${LABEL_CLS} mb-1`}>Fundamento Químico y Organoléptico</span>
        <p className="text-sm text-zinc-400 font-sans leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}

// ─── Lista de etiquetas testigo ───────────────────────────────────────────────
function WitnessBottleList({ bottles }: { bottles: WitnessBottle[] }) {
  if (!bottles || bottles.length === 0) return null;

  return (
    <div className="pt-4 border-t border-neutral-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={LABEL_CLS}>
          Etiquetas Testigo en Catálogo ({bottles.length})
        </h4>
        <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
          Añada · Bodega · Terruño
        </span>
      </div>

      <div className="divide-y divide-neutral-800/60 border-y border-neutral-800/60 text-xs">
        {bottles.map((bottle) => (
          <div
            key={`${bottle.winery}-${bottle.label}`}
            className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-300 group"
          >
            <div className="flex items-center gap-2">
              {bottle.vintage && (
                <span className="text-neutral-500 font-mono font-normal">
                  {bottle.vintage}
                </span>
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

// ─── Grid de sugerencias: Afinidad / Contraste / Evitar ──────────────────────
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
      <div className="space-y-1 border-t-2 border-emerald-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 block mb-2">
          Afinidad — Espejo Organoléptico
        </span>
        <ul className="divide-y divide-zinc-800/60">
          {affinities.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="group flex items-center justify-between w-full py-2 cursor-pointer transition-colors text-left"
              >
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-sans">
                  {item.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-150 shrink-0 ml-2" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. CONTRASTE */}
      <div className="space-y-1 border-t-2 border-amber-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 block mb-2">
          Contraste — Corte &amp; Balance
        </span>
        <ul className="divide-y divide-zinc-800/60">
          {contrasts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="group flex items-center justify-between w-full py-2 cursor-pointer transition-colors text-left"
              >
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-sans">
                  {item.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-150 shrink-0 ml-2" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. QUÉ EVITAR */}
      <div className="space-y-1 border-t-2 border-rose-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400 block mb-2">
          Combinaciones a Evitar
        </span>
        <ul className="space-y-3">
          {clashes.map((clash) => (
            <li key={clash.target}>
              <span className="text-sm font-medium text-zinc-200 block">
                {clash.target}
              </span>
              <span className="text-xs text-zinc-400 leading-normal block mt-0.5">
                {clash.reason}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Banner de procedencia ────────────────────────────────────────────────────
function SourceContextBanner({
  sourceContext,
  onClear,
  accent,
}: {
  sourceContext: string;
  onClear?: () => void;
  accent: 'rose' | 'amber';
}) {
  const colorCls =
    accent === 'rose' ? 'text-rose-300/90' : 'text-amber-300/90';
  return (
    <div
      className={`flex items-center justify-between text-xs font-sans py-1.5 border-b border-neutral-800/80 ${colorCls}`}
    >
      <span>Sugerencia derivada desde: &ldquo;{sourceContext}&rdquo;</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="hover:text-white transition-colors cursor-pointer text-[11px] uppercase tracking-wider flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          <span>Limpiar</span>
        </button>
      )}
    </div>
  );
}

/**
 * PairingDossierView Component
 * Ficha tipográfica integral de Maridaje (Modo Cepa y Modo Plato).
 * Estética editorial de WineDetailPage: texto estructurado, líneas sobrias, cero cards.
 *
 * IMPORTANTE — Reset de estado entre cepas:
 * El componente recibe una `key` desde PairingInteractiveHub basada en el ID activo.
 * React desmonta/remonta el componente al cambiar de cepa, reinicializando useState
 * sin necesidad de useEffect (prohibido por AGENTS.md para estado derivado).
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
  // ── MODO CEPA: tab activo (reset automático vía key desde el padre) ──────────
  const initialStyleId = wine
    ? (styleAnchor ?? wine.styles[0]?.styleId ?? '')
    : '';
  const [activeStyleId, setActiveStyleId] = useState<string>(initialStyleId);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO PLATO
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'food' && dish) {
    const foodImageUrl =
      'foodImageUrl' in dish ? dish.foodImageUrl : undefined;
    const categoryLabel =
      'familyId' in dish ? 'Plato Específico' : 'Categoría Gastronómica';

    return (
      <article className="space-y-8 animate-fadeIn">
        {sourceContext && (
          <SourceContextBanner
            sourceContext={sourceContext}
            onClear={onClearSourceContext}
            accent="amber"
          />
        )}

        {/* Cabecera con imagen */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-6 border-b border-zinc-800/80">
          <div className="space-y-2 flex-1 min-w-0">
            <span className={`${LABEL_CLS} text-amber-300/90`}>
              {categoryLabel}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-zinc-100 leading-tight">
              {dish.name}
            </h2>
            <p className="text-sm text-zinc-400 font-sans max-w-xl leading-relaxed">
              {dish.tagline}
            </p>
          </div>

          {foodImageUrl ? (
            <DossierImage
              src={foodImageUrl}
              alt={dish.name}
              badge={categoryLabel}
            />
          ) : null}
        </header>

        {/* Grilla técnica: Temperatura + Copa (datos duros) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-b border-zinc-800/80">
          <SpecCell
            label="Temperatura"
            value={dish.servingTemperature}
            mono
          />
          <SpecCell label="Copa" value={dish.glassware} />
        </div>

        {/* Bloque editorial: Tip + Fundamento */}
        <EditorialBlock
          tip={dish.serviceTip}
          rationale={dish.chemicalRationale}
        />

        {/* Sugerencias de Armonización */}
        <section className="space-y-3 pt-2 border-t border-neutral-800/80">
          <h3 className={LABEL_CLS}>Armonizaciones Enológicas Sugeridas</h3>
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

        <WitnessBottleList bottles={dish.witnessBottles} />
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO CEPA
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'wine' && wine) {
    const hasMultipleStyles = wine.styles.length > 1;
    const activeStyle: WineStyleProfile =
      wine.styles.find((s) => s.styleId === activeStyleId) ?? wine.styles[0];

    return (
      <article className="space-y-8 animate-fadeIn">
        {sourceContext && (
          <SourceContextBanner
            sourceContext={sourceContext}
            onClear={onClearSourceContext}
            accent="rose"
          />
        )}

        {/* Cabecera con imagen */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-6 border-b border-zinc-800/80">
          {/* Columna textual + tabs */}
          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${LABEL_CLS} text-rose-300`}>
                  Varietal Insignia
                </span>
                {wine.originNote && (
                  <>
                    <span className="text-neutral-600 text-xs" aria-hidden="true">·</span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {wine.originNote}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-zinc-100 leading-tight">
                {wine.name}
              </h2>
              <p className="text-sm text-zinc-400 font-sans max-w-xl leading-relaxed">
                {wine.tagline}
              </p>
            </div>

            {/* Tabs de estilos compactos */}
            {hasMultipleStyles && (
              <div
                className="flex items-center gap-0 border-b border-zinc-800"
                role="tablist"
                aria-label="Estilos del varietal"
              >
                {wine.styles.map((s) => (
                  <button
                    key={s.styleId}
                    type="button"
                    role="tab"
                    aria-selected={activeStyleId === s.styleId}
                    onClick={() => setActiveStyleId(s.styleId)}
                    className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                      activeStyleId === s.styleId
                        ? 'text-rose-300 border-rose-500'
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    {s.styleName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Imagen del racimo */}
          {wine.grapeImageUrl ? (
            <DossierImage
              src={wine.grapeImageUrl}
              alt={`Racimo de ${wine.name}`}
              badge="Vitis Vinifera"
            />
          ) : null}
        </header>

        {/* Bloque del estilo activo */}
        <section
          key={activeStyle.styleId}
          role={hasMultipleStyles ? 'tabpanel' : undefined}
          className="space-y-0"
        >
          {/* Grilla técnica simétrica: 5 columnas en desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-b border-zinc-800/80">
            <SpecCell
              label="Temperatura"
              value={activeStyle.servingTemperature}
              mono
            />
            <SpecCell label="Copa" value={activeStyle.glassware} />
            <SpecCell label="Acidez" value={activeStyle.acidity} />
            <SpecCell label="Cuerpo" value={activeStyle.body} />
            {activeStyle.tannins && (
              <SpecCell label="Taninos" value={activeStyle.tannins} />
            )}
          </div>

          {/* Bloque editorial: Tip + Fundamento */}
          <EditorialBlock
            tip={activeStyle.serviceTip}
            rationale={activeStyle.chemicalRationale}
          />

          {/* Sugerencias de Armonización */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <h4 className={LABEL_CLS}>Armonizaciones Gastronómicas Sugeridas</h4>
            <SuggestionsGrid
              affinities={activeStyle.affinities}
              contrasts={activeStyle.contrasts}
              clashes={activeStyle.clashes}
              mode="wine"
              currentName={wine.name}
              onSelectWine={onSelectWine}
              onSelectFood={onSelectFood}
            />
          </div>

          <WitnessBottleList bottles={activeStyle.witnessBottles} />
        </section>
      </article>
    );
  }

  return null;
}
