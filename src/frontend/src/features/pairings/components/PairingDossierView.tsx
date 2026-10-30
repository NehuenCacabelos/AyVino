import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
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

// ─── Label constante para la ficha técnica ────────────────────────────────────
const LABEL_CLS =
  'text-[11px] uppercase tracking-wider text-zinc-500 font-medium block';

// ─── Celda de la ficha técnica ────────────────────────────────────────────────
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
        className={`text-sm font-semibold text-neutral-200 mt-0.5 whitespace-nowrap ${
          mono ? 'font-mono' : 'font-sans'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Fundamento Químico y Organoléptico ──────────────────────────────────────
function ChemicalRationale({ text }: { text: string }) {
  return (
    <div className="border-l-2 border-zinc-700 pl-4 py-1">
      <p className="text-sm text-zinc-300 font-sans leading-relaxed max-w-3xl">
        {text}
      </p>
    </div>
  );
}

/**
 * WitnessBottleList Component
 * Lista tipográfica editorial de etiquetas reales del catálogo.
 * Tabla de índice con divide-y, sin font-mono en el wrapper.
 */
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

/**
 * SuggestionsGrid Component
 * Tres columnas tipográficas con acentos de borde temático superiores:
 * esmeralda (afinidad) / ámbar (contraste) / vino-rosa (evitar).
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
      <div className="space-y-2 border-t-2 border-emerald-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 block">
          Afinidad — Espejo Organoléptico
        </span>
        <ul className="space-y-1.5 text-sm">
          {affinities.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="text-left text-neutral-200 hover:text-emerald-200 hover:underline transition-colors font-sans cursor-pointer group flex items-start gap-1.5"
              >
                <span className="text-emerald-400/70 text-xs mt-0.5 select-none">
                  ↳
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. CONTRASTE */}
      <div className="space-y-2 border-t-2 border-amber-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 block">
          Contraste — Corte &amp; Balance
        </span>
        <ul className="space-y-1.5 text-sm">
          {contrasts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClickLink(item)}
                className="text-left text-neutral-200 hover:text-amber-200 hover:underline transition-colors font-sans cursor-pointer group flex items-start gap-1.5"
              >
                <span className="text-amber-400/70 text-xs mt-0.5 select-none">
                  ↳
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. QUÉ EVITAR */}
      <div className="space-y-2 border-t-2 border-rose-500/30 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400 block">
          Combinaciones a Evitar
        </span>
        <ul className="space-y-3 text-sm">
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

// ─── Encabezado de Procedencia ────────────────────────────────────────────────
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
    return (
      <article className="space-y-8 animate-fadeIn">
        {sourceContext && (
          <SourceContextBanner
            sourceContext={sourceContext}
            onClear={onClearSourceContext}
            accent="amber"
          />
        )}

        {/* Encabezado */}
        <header className="space-y-2">
          <div className={`${LABEL_CLS} text-amber-300/90`}>
            {'familyId' in dish
              ? 'Plato Específico'
              : 'Recomendación por Categoría Gastronómica'}
          </div>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
            {dish.name}
          </h2>
          <p className="text-base text-neutral-300 font-sans max-w-3xl leading-relaxed">
            {dish.tagline}
          </p>
        </header>

        {/* Ficha técnica de servicio */}
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4 py-3 border-y border-neutral-800/80">
          <SpecCell
            label="Temperatura de Servicio"
            value={dish.servingTemperature}
            mono
          />
          <SpecCell label="Cristalería Recomendada" value={dish.glassware} />
          <SpecCell label="Tip del Sommelier" value={dish.serviceTip} />
        </div>

        {/* Fundamento Enogastronómico */}
        <section className="space-y-3">
          <h3 className={LABEL_CLS}>Fundamento Químico y Organoléptico</h3>
          <ChemicalRationale text={dish.chemicalRationale} />
        </section>

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

        {/* Encabezado de la cepa */}
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`${LABEL_CLS} text-rose-300`}>Varietal Insignia</span>
            {wine.originNote && (
              <>
                <span className="text-neutral-600 text-xs" aria-hidden="true">
                  ·
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {wine.originNote}
                </span>
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

        {/* Tabs de estilos (solo si hay más de uno) */}
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

        {/* Bloque del estilo activo (único, sin scroll acumulativo) */}
        <section
          key={activeStyle.styleId}
          role={hasMultipleStyles ? 'tabpanel' : undefined}
          className="space-y-6"
        >
          {/* Ficha técnica de servicio y perfil */}
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4 py-3 border-y border-neutral-800/80">
            <SpecCell
              label="Temperatura Óptima"
              value={activeStyle.servingTemperature}
              mono
            />
            <SpecCell label="Copa de Servicio" value={activeStyle.glassware} />
            <SpecCell label="Acidez" value={activeStyle.acidity} />
            <SpecCell label="Cuerpo" value={activeStyle.body} />
            {activeStyle.tannins && (
              <SpecCell label="Taninos" value={activeStyle.tannins} />
            )}
            <SpecCell label="Tip de Servicio" value={activeStyle.serviceTip} />
          </div>

          {/* Fundamento Enogastronómico */}
          <div className="space-y-3">
            <h4 className={LABEL_CLS}>Fundamento Químico y Organoléptico</h4>
            <ChemicalRationale text={activeStyle.chemicalRationale} />
          </div>

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
