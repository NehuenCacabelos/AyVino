import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  X,
  AlertTriangle,
  Lightbulb,
  FlaskConical,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  WineGlassSilhouette,
  detectGlassType,
  getGlassDisplayName,
} from './WineGlassSilhouette';
import { WineFoodPairingSection } from './WineFoodPairingSection';
import {
  type WineVarietyEntry,
  type DishPairingEntry,
  type FoodFamilyInfo,
  type WineStyleProfile,
  type WitnessBottle,
  type PairingLink,
  getEnrichedAffinities,
  getEnrichedContrasts,
  getEnrichedClashes,
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
const LABEL_MONO =
  'text-[11px] uppercase tracking-[0.18em] font-mono font-medium';

// ─── Formateador de temperatura con 'a' destacada en ámbar ────────────────────
function formatTemperature(tempStr: string) {
  const clean = tempStr.replace(/\s*°C/g, '°C');
  if (clean.includes(' a ')) {
    const parts = clean.split(' a ');
    return (
      <>
        <span>{parts[0]}</span>{' '}
        <span className="text-[#e5a93c] font-sans font-normal">a</span>{' '}
        <span>{parts[1]}</span>
      </>
    );
  }
  return <span>{clean}</span>;
}

// ─── Hero image inmersivo para modo plato ─────────────────────────────────────
function PairingHeroImage({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full rounded-none overflow-hidden aspect-[21/9] md:aspect-[16/7] min-h-[220px] border border-white/10 shadow-2xl">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/60 to-transparent"
        aria-hidden="true"
      />
      {children && (
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Card de afinidad / contraste con foto ────────────────────────────────────
function PairingAffinityCard({
  link,
  variant,
  mode,
  currentName,
  onSelectWine,
  onSelectFood,
}: {
  link: PairingLink;
  variant: 'affinity' | 'contrast';
  mode: 'wine' | 'food';
  currentName: string;
  onSelectWine: (id: string, anchor?: string, fromLabel?: string) => void;
  onSelectFood: (id: string, fromLabel?: string) => void;
}) {
  const isAffinity = variant === 'affinity';
  const badgePercent = isAffinity ? '94%' : '72%';
  const borderColor = isAffinity
    ? 'border-emerald-500/30 hover:border-emerald-400/60'
    : 'border-amber-500/30 hover:border-amber-400/60';
  const badgeColor = isAffinity
    ? 'bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
    : 'bg-amber-900/70 text-amber-300 border-amber-500/40';
  const labelColor = isAffinity ? 'text-emerald-400' : 'text-amber-400';
  const variantLabel = isAffinity ? 'Afinidad' : 'Contraste';
  const arrowColor = isAffinity
    ? 'text-emerald-500/60 group-hover:text-emerald-400'
    : 'text-amber-500/60 group-hover:text-amber-400';

  const handleClick = () => {
    if (mode === 'wine') {
      onSelectFood(link.id, currentName);
    } else {
      onSelectWine(link.id, link.styleAnchor, currentName);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex flex-col gap-3 p-4 rounded-none border bg-[#201f21] hover:bg-[#2a2a2c] transition-all duration-200 cursor-pointer text-left w-full ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <span className={`${LABEL_MONO} ${labelColor}`}>{variantLabel}</span>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none border ${badgeColor}`}
        >
          {badgePercent}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[#e5e1e4] font-sans leading-snug group-hover:text-white transition-colors">
          {link.label}
        </span>
        <ArrowRight
          className={`w-4 h-4 shrink-0 transition-all duration-150 group-hover:translate-x-0.5 ${arrowColor}`}
        />
      </div>
    </button>
  );
}

// ─── Card de clash / alerta ───────────────────────────────────────────────────
function PairingClashCard({ target, reason }: { target: string; reason: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-none border border-rose-900/40 bg-rose-950/20">
      <AlertTriangle
        className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <span className="text-sm font-semibold text-rose-200 block leading-snug">
          {target}
        </span>
        <span className="text-xs text-rose-300/70 leading-relaxed block mt-0.5">
          {reason}
        </span>
      </div>
    </div>
  );
}

// ─── Tarjetas Paralelas Editoriales (Modo Cepa: Stitch Design) ───────────────
interface WineEditorialDualCardsProps {
  style: WineStyleProfile;
  wineName: string;
}

function WineEditorialDualCards({ style, wineName }: WineEditorialDualCardsProps) {
  const serviceMeta = style.serviceMetadata ?? {
    label: 'TEMPERATURA RECOMENDADA',
    value: style.servingTemperature,
  };

  const tipTitle = style.serviceTipTitle ?? 'Oxigenación y Temperatura Óptima';
  const rationaleQuestion =
    style.rationaleQuestion ?? `¿Por qué el ${wineName} es ideal para este maridaje?`;

  const metrics = style.pairingMetrics ?? [
    { label: 'AFINIDAD GRASA', percentage: 92, variant: 'amber' as const },
    { label: 'BALANCE TÁNICO', percentage: 88, variant: 'wine' as const },
    { label: 'RETROGUSTO Y NOTAS', percentage: 85, variant: 'zinc' as const },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
      {/* Tarjeta Izquierda (Tip del Sommelier) - lg:col-span-4 */}
      <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#121113] p-7 flex flex-col justify-between shadow-xl">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              TIP DEL SOMMELIER
            </span>
          </div>

          {/* Cuerpo con espaciado equilibrado */}
          <h3 className="font-serif text-xl sm:text-2xl text-zinc-100 font-normal mt-5 mb-4 tracking-tight">
            {tipTitle}
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed font-light mb-4">
            {style.serviceTip}
          </p>

          {/* Segundo tip casero / humano de servicio */}
          {style.practicalTip && (
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block mb-1">
                  CONSEJO CASERO DE SERVICIO
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-light">
                  {style.practicalTip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{serviceMeta.label}</span>
          </div>
          <span className="text-amber-400 font-medium shrink-0 ml-2">
            {serviceMeta.value}
          </span>
        </div>
      </div>

      {/* Tarjeta Derecha (Fundamento y Por qué funciona el maridaje) - lg:col-span-8 */}
      <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#121113] p-7 flex flex-col justify-between shadow-xl">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400/90 shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400/90 font-semibold">
              POR QUÉ FUNCIONA • FUNDAMENTO
            </span>
          </div>

          {/* Cuerpo con el mismo espaciado armónico */}
          <h3 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal mt-5 mb-4 tracking-tight leading-snug">
            {rationaleQuestion}
          </h3>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
            {style.chemicalRationale}
          </p>
        </div>

        {/* Barras de Balance y Afinidad (Footer) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/5">
          {metrics.map((metric) => {
            const isAmber = metric.variant === 'amber';
            const isWine = metric.variant === 'wine';
            const valueColor = isAmber
              ? 'text-amber-400'
              : isWine
              ? 'text-zinc-300'
              : 'text-zinc-300';
            const barFillColor = isAmber
              ? 'bg-amber-400'
              : isWine
              ? 'bg-[#7a1c2d]'
              : 'bg-zinc-400';

            return (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                    {metric.label}
                  </span>
                  <span className={`text-xs font-semibold ${valueColor}`}>
                    {metric.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
                    role="progressbar"
                    aria-valuenow={metric.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={metric.label}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Bloque editorial: Tip + Fundamento ──────────────────────────────────────
function EditorialBlock({ tip, rationale }: { tip: string; rationale: string }) {
  return (
    <div className="rounded-none border border-white/[0.06] bg-[#1c1b1d] divide-y divide-white/[0.06]">
      <div className="p-4 sm:p-5 flex items-start gap-3">
        <div
          className="w-1 self-stretch rounded-none bg-[#fbbf24]/80 shrink-0"
          aria-hidden="true"
        />
        <div>
          <span className={`${LABEL_MONO} text-[#fbbf24]/80 mb-1.5 block`}>
            Tip del Sommelier
          </span>
          <p className="text-sm text-[#e5e1e4] font-sans leading-relaxed">{tip}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <span className={`${LABEL_MONO} text-[#a18c8c] mb-1.5 block`}>
          Fundamento Bioquímico & Organoléptico
        </span>
        <p className="text-sm text-[#d8c1c2] font-sans leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}

// ─── Lista de etiquetas testigo ───────────────────────────────────────────────
function WitnessBottleList({ bottles }: { bottles: WitnessBottle[] }) {
  if (!bottles || bottles.length === 0) return null;
  return (
    <div className="space-y-3">
      <h4 className={`${LABEL_MONO} text-[#a18c8c]`}>
        Etiquetas de la Cava ({bottles.length})
      </h4>
      <div className="divide-y divide-white/[0.05] border border-white/[0.06] rounded-none overflow-hidden">
        {bottles.map((bottle) => (
          <div
            key={`${bottle.winery}-${bottle.label}`}
            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#1c1b1d] hover:bg-[#201f21] transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {bottle.vintage && (
                <span className="text-[11px] font-mono text-[#fbbf24]/70 shrink-0">
                  {bottle.vintage}
                </span>
              )}
              <span className="text-sm text-[#e5e1e4] font-medium group-hover:text-white transition-colors truncate">
                {bottle.label}
              </span>
              <span className="text-[11px] text-[#a18c8c] shrink-0 hidden sm:inline">
                · {bottle.winery}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#a18c8c] shrink-0">
              <span className="truncate max-w-[160px]">{bottle.region}</span>
              {bottle.catalogWineId && (
                <Link
                  to={`/catalogo?q=${encodeURIComponent(bottle.winery)}`}
                  className="inline-flex items-center gap-0.5 text-[#ffb2b8] hover:text-white transition-colors shrink-0"
                  title="Ver en catálogo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Ver</span>
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

// ─── Grid de Afinidad + Contraste + Evitar ───────────────────────────────────
function SuggestionsSection({
  affinities,
  contrasts,
  clashes,
  mode,
  currentName,
  onSelectWine,
  onSelectFood,
  titleLabel,
}: {
  affinities: PairingLink[];
  contrasts: PairingLink[];
  clashes: { target: string; reason: string }[];
  mode: 'wine' | 'food';
  currentName: string;
  onSelectWine: (id: string, anchor?: string, fromLabel?: string) => void;
  onSelectFood: (id: string, fromLabel?: string) => void;
  titleLabel: string;
}) {
  return (
    <div className="space-y-5">
      <h3 className={`${LABEL_MONO} text-[#a18c8c]`}>{titleLabel}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <span className={`${LABEL_MONO} text-emerald-400 block`}>
            Afinidad — Espejo Organoléptico
          </span>
          <div className="flex flex-col gap-2">
            {affinities.map((link) => (
              <PairingAffinityCard
                key={link.id}
                link={link}
                variant="affinity"
                mode={mode}
                currentName={currentName}
                onSelectWine={onSelectWine}
                onSelectFood={onSelectFood}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className={`${LABEL_MONO} text-amber-400 block`}>
            Contraste — Corte & Balance
          </span>
          <div className="flex flex-col gap-2">
            {contrasts.map((link) => (
              <PairingAffinityCard
                key={link.id}
                link={link}
                variant="contrast"
                mode={mode}
                currentName={currentName}
                onSelectWine={onSelectWine}
                onSelectFood={onSelectFood}
              />
            ))}
          </div>
        </div>
      </div>

      {clashes.length > 0 && (
        <div className="space-y-2">
          <span className={`${LABEL_MONO} text-rose-400 block`}>
            Combinaciones a Evitar
          </span>
          <div className="flex flex-col gap-2">
            {clashes.map((clash) => (
              <PairingClashCard
                key={clash.target}
                target={clash.target}
                reason={clash.reason}
              />
            ))}
          </div>
        </div>
      )}
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
    accent === 'rose'
      ? 'text-[#ffb2b8]/80 border-[#ffb2b8]/20'
      : 'text-[#fbbf24]/80 border-[#fbbf24]/20';
  return (
    <div
      className={`flex items-center justify-between text-xs font-sans py-2 px-4 rounded-lg border bg-white/[0.03] ${colorCls}`}
    >
      <span>Sugerencia derivada desde: &ldquo;{sourceContext}&rdquo;</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="hover:text-white transition-colors cursor-pointer text-[10px] uppercase tracking-wider flex items-center gap-1 ml-3 shrink-0"
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
 * Ficha editorial inmersiva de Maridaje (Modo Cepa y Modo Plato).
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
  // MODO CEPA: sub-estilo activo
  const initialStyleId = wine
    ? (styleAnchor ?? wine.styles[0]?.styleId ?? '')
    : '';
  const [activeStyleId, setActiveStyleId] = useState<string>(initialStyleId);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO PLATO — "¿Qué vas a comer?"
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

        <header className="space-y-2">
          <span className={`${LABEL_MONO} text-[#fbbf24]/80`}>{categoryLabel}</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-[#e5e1e4] leading-tight">
            {dish.name}
          </h2>
          <p className="text-sm text-[#d8c1c2] font-sans max-w-2xl leading-relaxed">
            {dish.tagline}
          </p>
        </header>

        {foodImageUrl && (
          <PairingHeroImage src={foodImageUrl} alt={dish.name}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                <span className={`${LABEL_MONO} text-[#fbbf24]`}>Temperatura</span>
                <span className="text-sm font-mono font-bold text-white">
                  {dish.servingTemperature}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                <WineGlassSilhouette glassware={dish.glassware} className="w-5 h-7 text-[#fbbf24] shrink-0" />
                <div>
                  <span className={`${LABEL_MONO} text-[#fbbf24] text-[10px] block leading-none mb-0.5`}>Copa</span>
                  <span className="text-sm text-white font-medium">{dish.glassware}</span>
                </div>
              </div>
            </div>
          </PairingHeroImage>
        )}

        <EditorialBlock tip={dish.serviceTip} rationale={dish.chemicalRationale} />

        <SuggestionsSection
          affinities={dish.affinities}
          contrasts={dish.contrasts}
          clashes={dish.clashes}
          mode="food"
          currentName={dish.name}
          onSelectWine={onSelectWine}
          onSelectFood={onSelectFood}
          titleLabel="Armonizaciones Enológicas Sugeridas"
        />

        <WitnessBottleList bottles={dish.witnessBottles} />
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODO CEPA — "¿Qué vas a tomar?" (Idéntico a la imagen de referencia)
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

        {/* 1. ARTÍCULO PRINCIPAL DE LA CEPA SELECCIONADA (ESTILO REVISTA EDITORIAL) */}
        <section
          key={wine.id}
          aria-label={`Ficha editorial de ${wine.name}`}
          className="relative rounded-2xl border border-white/10 bg-[#121113] p-6 sm:p-8 md:p-10 text-white shadow-2xl overflow-hidden"
        >
          {/* Imagen de fondo integrada a la derecha (50-60% del ancho) con gradientes de fusión suaves */}
          {wine.grapeImageUrl && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 md:w-3/5 overflow-hidden select-none">
              <img
                src={wine.grapeImageUrl}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center opacity-25"
              />
              <div
                className="absolute inset-0 bg-gradient-to-l from-transparent via-[#121113]/70 to-[#121113]"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#121113] via-transparent to-[#121113]/40"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col justify-between">
            {/* Bloque Superior: Header, Título, Descripción y Perfiles con espaciado natural y desahogado */}
            <div>
              {/* Encabezado Dinámico: Solo Malbec muestra "VARIETAL INSIGNIA • ", el resto muestra su región/terroir */}
              <div className="mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80 font-medium">
                  {wine.id === 'malbec'
                    ? `VARIETAL INSIGNIA • ${wine.originNote?.toUpperCase() || 'PRIMERA ZONA Y VALLE DE UCO'}`
                    : (wine.originNote?.toUpperCase() || 'TERRUÑO ARGENTINO')}
                </span>
              </div>

              {/* Título amplio y con presencia */}
              <h2 className="font-serif text-5xl sm:text-6xl font-normal text-zinc-100 tracking-tight leading-none mb-4">
                {wine.name}
              </h2>

              {/* Descripción editorial con espacio y tamaño cómodo para leer */}
              <p className="text-zinc-300 font-serif italic text-base sm:text-lg leading-relaxed max-w-2xl sm:max-w-3xl">
                {wine.tagline}
              </p>

              {/* Selector de Perfiles (Tabs/Toggles) - Exclusivo para cepas con más de un estilo (Malbec y Chardonnay) */}
              {hasMultipleStyles && (
                <div
                  className="mt-6 sm:mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3"
                  role="tablist"
                  aria-label="Estilos del varietal"
                >
                  {wine.styles.map((s) => {
                    const isStyleActive = activeStyleId === s.styleId;
                    return (
                      <button
                        key={s.styleId}
                        type="button"
                        role="tab"
                        aria-selected={isStyleActive}
                        onClick={() => setActiveStyleId(s.styleId)}
                        className={[
                          'px-5 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border',
                          isStyleActive
                            ? 'bg-[#5a1a24] hover:bg-[#6e202c] text-white border-transparent shadow-sm'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10',
                        ].join(' ')}
                      >
                        {s.styleName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Métricas Organolépticas (Cápsula inferior a distancia visual armónica, sin huecos vacíos) */}
            <div className="mt-8 sm:mt-10 rounded-xl border border-white/5 bg-black/40 p-5 sm:p-6 backdrop-blur-md">
              <div
                className={[
                  'grid gap-6 sm:gap-8',
                  activeStyle.tannins
                    ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-4',
                ].join(' ')}
              >
                {/* 1. TEMPERATURA */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    TEMPERATURA
                  </span>
                  <span className="text-sm font-semibold text-amber-400 font-mono">
                    {formatTemperature(activeStyle.servingTemperature)}
                  </span>
                </div>

                {/* 2. COPA RECOMENDADA */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    COPA RECOMENDADA
                  </span>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-11 rounded-lg bg-white/[0.04] border border-white/10 shrink-0 flex items-center justify-center text-amber-400 shadow-sm"
                      title={getGlassDisplayName(detectGlassType(activeStyle.glassware))}
                    >
                      <WineGlassSilhouette
                        glassware={activeStyle.glassware}
                        className="w-6 h-8 text-amber-400"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-zinc-200 leading-snug block">
                        {activeStyle.glassware}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider block mt-0.5">
                        {getGlassDisplayName(detectGlassType(activeStyle.glassware))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. ACIDEZ */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    ACIDEZ
                  </span>
                  <span className="text-sm font-medium text-zinc-200 leading-snug block">
                    {activeStyle.acidity}
                  </span>
                </div>

                {/* 4. CUERPO / DENSIDAD */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    CUERPO / DENSIDAD
                  </span>
                  <span className="text-sm font-medium text-zinc-200 leading-snug block">
                    {activeStyle.body}
                  </span>
                </div>

                {/* 5. TANINOS (Solo si la cepa los posee) */}
                {activeStyle.tannins && (
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      TANINOS
                    </span>
                    <span className="text-sm font-semibold text-amber-400 leading-snug block">
                      {activeStyle.tannins}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. TIP DEL SOMMELIER Y FUNDAMENTO (TARJETAS PARALELAS STITCH) */}
        <WineEditorialDualCards
          style={activeStyle}
          wineName={wine.name}
        />

        {/* 3. MARIDAJES GASTRONÓMICOS SUGERIDOS (GRID EDITORIAL DE 3 COLUMNAS) */}
        <WineFoodPairingSection
          affinities={getEnrichedAffinities(activeStyle)}
          contrasts={getEnrichedContrasts(activeStyle)}
          clashes={getEnrichedClashes(activeStyle)}
          wineName={wine.name}
          onSelectWine={onSelectWine}
          onSelectFood={onSelectFood}
        />

        {/* 4. ETIQUETAS DE LA CAVA */}
        <WitnessBottleList bottles={activeStyle.witnessBottles} />
      </article>
    );
  }

  return null;
}
