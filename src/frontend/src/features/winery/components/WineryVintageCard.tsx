import { Star, Thermometer, Wine, Archive, Calendar, Edit3 } from 'lucide-react';
import type { WineryCatalogVintageDto } from '../types/catalog';
import { getVintageStatusBadge } from '../utils/catalogUtils';
import WineryCatalogBottleSilhouette from './WineryCatalogBottleSilhouette';
import { cn } from '../../../lib/utils';

export interface WineryVintageCardProps {
  vintage: WineryCatalogVintageDto;
  wineryStatus?: string;
  onEditVintage?: (vintage: WineryCatalogVintageDto) => void;
}

const BLEND_COLORS = [
  'bg-rose-700',
  'bg-amber-600',
  'bg-purple-700',
  'bg-pink-700',
  'bg-red-800',
  'bg-orange-600',
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function WineryVintageCard({
  vintage,
  wineryStatus,
  onEditVintage,
}: WineryVintageCardProps) {
  const statusBadge = getVintageStatusBadge(vintage.approvalStatus, wineryStatus);
  const formattedDate = formatDate(vintage.registerDate);

  // Sumar porcentajes para calcular barra si faltan proporciones
  const grapes = vintage.grapes ?? [];
  const totalPercentage = grapes.reduce((acc, g) => acc + (g.percentage ?? 0), 0);

  return (
    <article className="bg-[#121015] hover:bg-[#151218] rounded-2xl border border-white/5 hover:border-white/10 transition-colors p-5 shadow-md flex flex-col md:flex-row items-start gap-5">
      {/* Botella / Foto de la Cosecha */}
      <div className="w-20 h-32 md:w-24 md:h-36 bg-[#0a0a0c] rounded-xl border border-white/5 flex items-center justify-center p-2 shrink-0 overflow-hidden self-center md:self-start">
        {vintage.imageUrl ? (
          <img
            src={vintage.imageUrl}
            alt={`Cosecha ${vintage.year ?? 'S/A'}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain drop-shadow"
          />
        ) : (
          <WineryCatalogBottleSilhouette className="w-8 h-24 text-neutral-600" />
        )}
      </div>

      {/* Contenido Principal de la Cosecha */}
      <div className="flex-1 min-w-0 space-y-3.5 w-full">
        {/* Fila Superior: Año, Estado y Botón Editar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h4 className="font-serif text-2xl font-bold text-zinc-100">
              {vintage.year ? `Cosecha ${vintage.year}` : 'Sin año (S/A)'}
            </h4>

            {/* Badge de Estado */}
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border',
                statusBadge.tone === 'emerald' &&
                  'bg-emerald-950/40 border-emerald-900/40 text-emerald-300',
                statusBadge.tone === 'amber' &&
                  'bg-amber-950/40 border-amber-900/40 text-amber-300',
                statusBadge.tone === 'neutral' &&
                  'bg-white/5 border-white/10 text-neutral-300',
                statusBadge.tone === 'rose' &&
                  'bg-rose-950/40 border-rose-900/40 text-rose-300'
              )}
            >
              {statusBadge.label}
            </span>
          </div>

          {onEditVintage && (
            <button
              type="button"
              onClick={() => onEditVintage(vintage)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Editar añada</span>
            </button>
          )}
        </div>

        {/* Ficha Enológica: Alcohol, Temperatura, Guarda y Calificación */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-neutral-400">
          {vintage.alcoholContent != null && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/5">
              <Wine className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{vintage.alcoholContent}% vol</span>
            </div>
          )}

          {vintage.servingTemperature != null && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{vintage.servingTemperature} °C</span>
            </div>
          )}

          {vintage.averageRating != null ? (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/5 font-mono text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-300 shrink-0" />
              <span>{vintage.averageRating.toFixed(1)}</span>
              <span className="text-neutral-500 font-sans text-[11px]">
                ({vintage.reviewCount})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/5 text-neutral-500 text-[11px]">
              <span>Sin valoraciones</span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0a0a0c] border border-white/5 text-[11px] font-mono">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Consejo de Guarda */}
        {vintage.agingAdvice && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#0a0a0c] border border-white/5 text-xs text-neutral-300 font-sans">
            <Archive className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong className="text-zinc-200">Consejo de guarda: </strong>
              {vintage.agingAdvice}
            </p>
          </div>
        )}

        {/* Blend Varietal de Uvas */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
            Corte varietal
          </span>

          {grapes.length > 0 ? (
            <div className="space-y-2">
              {/* Barra Proporcional */}
              {totalPercentage > 0 && (
                <div
                  role="progressbar"
                  aria-valuenow={totalPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Proporción de uvas"
                  className="flex h-2 w-full rounded-full overflow-hidden bg-white/5"
                >
                  {grapes.map((g, idx) => {
                    const pct = g.percentage ?? 0;
                    if (pct <= 0) return null;
                    const colorClass = BLEND_COLORS[idx % BLEND_COLORS.length];
                    return (
                      <div
                        key={g.grapeId}
                        style={{ width: `${pct}%` }}
                        className={cn('h-full transition-all', colorClass)}
                        title={`${g.grapeName}: ${pct}%`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Lista de Uvas con Chips */}
              <div className="flex flex-wrap gap-2">
                {grapes.map((g, idx) => {
                  const colorClass = BLEND_COLORS[idx % BLEND_COLORS.length];
                  return (
                    <div
                      key={g.grapeId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0a0c] border border-white/5 text-xs"
                    >
                      <span
                        className={cn('w-2 h-2 rounded-full shrink-0', colorClass)}
                        aria-hidden="true"
                      />
                      <span className="text-zinc-200">{g.grapeName}</span>
                      {g.percentage != null && (
                        <span className="font-mono text-neutral-400 text-[11px]">
                          {g.percentage}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              Varietal o corte no especificado en esta añada.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
