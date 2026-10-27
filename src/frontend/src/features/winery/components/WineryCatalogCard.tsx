import { Link } from 'react-router-dom';
import { Star, Plus, ArrowRight } from 'lucide-react';
import type { WineryCatalogWineDto } from '../types/catalog';
import {
  getVintageYearsRange,
  getMainGrape,
  getVintageStatusSummary,
} from '../utils/catalogUtils';
import WineryCatalogBottleSilhouette from './WineryCatalogBottleSilhouette';
import { cn } from '../../../lib/utils';

export interface WineryCatalogCardProps {
  wine: WineryCatalogWineDto;
  wineryStatus?: string;
  viewMode?: 'grid' | 'list';
  onAddVintage?: (wine: WineryCatalogWineDto) => void;
}

function getWineTypeSpanish(type?: string | null): string {
  switch (type?.toLowerCase()) {
    case 'red':
      return 'Tinto';
    case 'white':
      return 'Blanco';
    case 'rose':
      return 'Rosado';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type || 'Vino';
  }
}

export default function WineryCatalogCard({
  wine,
  wineryStatus,
  viewMode = 'grid',
  onAddVintage,
}: WineryCatalogCardProps) {
  // Obtener la imagen de la añada más reciente con foto
  const vintageWithImage = wine.vintages.find((v) => Boolean(v.imageUrl));
  const coverImage = vintageWithImage?.imageUrl;

  const yearsRange = getVintageYearsRange(wine.vintages);
  const mainGrape = getMainGrape(wine.vintages);
  const statusChips = getVintageStatusSummary(wine.vintages, wineryStatus);
  const wineTypeLabel = getWineTypeSpanish(wine.wineType);

  if (viewMode === 'list') {
    return (
      <article className="group relative bg-[#121015] hover:bg-[#16131a] rounded-2xl border border-white/5 hover:border-white/10 transition-all p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <Link
          to={`/bodega/vinos/${wine.id}`}
          className="flex items-center gap-4 flex-1 min-w-0"
        >
          {/* Botella en miniatura */}
          <div className="w-14 h-20 bg-[#0a0a0c] rounded-xl border border-white/5 flex items-center justify-center p-2 shrink-0 overflow-hidden">
            {coverImage ? (
              <img
                src={coverImage}
                alt={wine.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain drop-shadow"
              />
            ) : (
              <WineryCatalogBottleSilhouette className="w-6 h-16 text-neutral-500" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              <span className="text-rose-400 font-semibold">{wineTypeLabel}</span>
              <span>·</span>
              <span>{yearsRange}</span>
            </div>

            <h3 className="font-serif text-lg font-semibold text-zinc-100 group-hover:text-rose-200 transition-colors truncate">
              {wine.name}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              {mainGrape && (
                <span>
                  Uva: <strong className="text-neutral-200">{mainGrape.grapeName}</strong>
                  {mainGrape.percentage != null && ` (${mainGrape.percentage}%)`}
                </span>
              )}
              {wine.averageRating != null && (
                <span className="flex items-center gap-1 text-amber-300 font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>{wine.averageRating.toFixed(1)}</span>
                  <span className="text-neutral-500 font-sans">({wine.reviewCount})</span>
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Chips de estado y botón de acción */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusChips.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border',
                  chip.tone === 'emerald' && 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300',
                  chip.tone === 'amber' && 'bg-amber-950/40 border-amber-900/40 text-amber-300',
                  chip.tone === 'neutral' && 'bg-white/5 border-white/10 text-neutral-300',
                  chip.tone === 'rose' && 'bg-rose-950/40 border-rose-900/40 text-rose-300'
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddVintage?.(wine);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Agregar añada"
            aria-label={`Agregar añada a ${wine.name}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </article>
    );
  }

  // Vista en Grilla (por defecto)
  return (
    <article className="group relative bg-[#121015] hover:bg-[#151218] rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-2xl">
      <Link to={`/bodega/vinos/${wine.id}`} className="block">
        {/* Cabecera / Vitrina de Botella */}
        <div className="relative w-full h-48 bg-[#0a0a0c] border-b border-white/5 flex items-center justify-center p-4 overflow-hidden group-hover:bg-[#0c0c0e] transition-colors">
          {coverImage ? (
            <img
              src={coverImage}
              alt={wine.name}
              loading="lazy"
              decoding="async"
              className="max-h-40 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <WineryCatalogBottleSilhouette className="w-12 h-36 text-neutral-600 transition-transform duration-300 group-hover:scale-105" />
          )}

          {/* Badge flotante de tipo de vino */}
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-black/60 backdrop-blur-md border border-white/10 text-rose-300">
            {wineTypeLabel}
          </span>
        </div>

        {/* Cuerpo informativo */}
        <div className="p-5 space-y-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
              {yearsRange}
            </span>
            <h3 className="font-serif text-lg font-semibold text-zinc-100 group-hover:text-rose-200 transition-colors leading-snug line-clamp-1">
              {wine.name}
            </h3>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-400">
            {mainGrape && (
              <p className="truncate">
                Uva principal:{' '}
                <strong className="text-zinc-200 font-medium">
                  {mainGrape.grapeName}
                </strong>
                {mainGrape.percentage != null && (
                  <span className="text-rose-400 font-mono ml-1">
                    ({mainGrape.percentage}%)
                  </span>
                )}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              {wine.averageRating != null ? (
                <div className="flex items-center gap-1.5 text-amber-300 font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span className="font-semibold">{wine.averageRating.toFixed(1)}</span>
                  <span className="text-neutral-500 font-sans text-[11px]">
                    ({wine.reviewCount})
                  </span>
                </div>
              ) : (
                <span className="text-neutral-500 font-mono text-[11px]">Sin reseñas</span>
              )}
            </div>
          </div>

          {/* Chips de estado */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
            {statusChips.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border',
                  chip.tone === 'emerald' && 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300',
                  chip.tone === 'amber' && 'bg-amber-950/40 border-amber-900/40 text-amber-300',
                  chip.tone === 'neutral' && 'bg-white/5 border-white/10 text-neutral-300',
                  chip.tone === 'rose' && 'bg-rose-950/40 border-rose-900/40 text-rose-300'
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Footer de Tarjeta con Botón Rápido "Agregar añada" y Enlace a Ficha */}
      <div className="px-5 py-3 bg-[#0e0c10] border-t border-white/5 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onAddVintage?.(wine)}
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-rose-300 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar añada</span>
        </button>

        <Link
          to={`/bodega/vinos/${wine.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400 group-hover:text-rose-200 transition-colors"
        >
          <span>Ficha</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
