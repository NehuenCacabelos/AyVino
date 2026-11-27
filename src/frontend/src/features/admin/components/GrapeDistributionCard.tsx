import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, PieChart } from 'lucide-react';
import { getGrapesDistribution } from '../api/adminStatsApi';
import type { GrapesDistribution } from '../types/adminStats';
import { buildGrapeSlices } from '../utils/dashboardCharts';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import ErrorBanner from './ErrorBanner';
import { cn } from '../../../lib/utils';

interface FetchState {
  data: GrapesDistribution | null;
  isLoading: boolean;
  error: string | null;
}

const DONUT_SIZE = 224;
const DONUT_CENTER = DONUT_SIZE / 2;
const DONUT_RADIUS = 82;
const DONUT_STROKE_WIDTH = 28;
const DONUT_ACTIVE_STROKE_WIDTH = 34;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const INITIAL_VISIBLE_GRAPES = 6;

function formatSubtitle(totalVintages: number): string {
  return totalVintages === 1
    ? 'Participación enológica de 1 cosecha aprobada.'
    : `Participación enológica de las ${totalVintages} cosechas aprobadas.`;
}

function formatCountLabel(count: number): string {
  return count === 1 ? '1 cosecha' : `${count} cosechas`;
}

export default function GrapeDistributionCard({ className }: { className?: string }) {
  const [state, setState] = useState<FetchState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [pinnedLabel, setPinnedLabel] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getGrapesDistribution()
      .then((data) => {
        if (isMounted) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setState({ data: null, isLoading: false, error: getApiErrorMessage(err) });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchKey]);

  const handleRetry = useCallback(() => {
    setHoveredLabel(null);
    setPinnedLabel(null);
    setShowAll(false);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setFetchKey((prev) => prev + 1);
  }, []);

  const handleTogglePin = useCallback((label: string) => {
    setPinnedLabel((prev) => (prev === label ? null : label));
  }, []);

  const handleToggleShowAll = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  const slices = useMemo(
    () => (state.data ? buildGrapeSlices(state.data) : []),
    [state.data],
  );

  const visibleSlices = useMemo(
    () => (showAll ? slices : slices.slice(0, INITIAL_VISIBLE_GRAPES)),
    [slices, showAll],
  );

  const hiddenCount = Math.max(0, slices.length - INITIAL_VISIBLE_GRAPES);

  const activeLabel = hoveredLabel ?? pinnedLabel;
  const activeSlice = useMemo(
    () => (activeLabel ? slices.find((slice) => slice.label === activeLabel) ?? null : null),
    [slices, activeLabel],
  );

  const donutAriaLabel = useMemo(() => {
    if (slices.length === 0) {
      return 'Distribución por Varietales sin datos';
    }
    const summary = slices
      .map((slice) => `${slice.label} ${slice.percent}% (${slice.count})`)
      .join(', ');
    return `Distribución por Varietales: ${summary}`;
  }, [slices]);

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-[#121015] p-5 flex flex-col gap-4',
        className,
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-amber-400/90">
              Desglose de cepa
            </p>
            <h2 className="mt-1 text-lg font-serif font-semibold text-zinc-100">
              Distribución por Varietales
            </h2>
          </div>
          <PieChart className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
        </div>

        {!state.isLoading && !state.error && state.data && slices.length > 0 && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {formatSubtitle(state.data.totalVintages)}
          </p>
        )}
      </div>

      {state.isLoading && (
        <div
          data-testid="grape-distribution-loading"
          aria-busy="true"
          className="flex flex-col items-center gap-6 py-4 animate-pulse"
        >
          <div className="w-56 h-56 rounded-full border-[28px] border-white/10 shrink-0" />
          <div className="w-full space-y-2.5">
            <div className="h-3.5 rounded bg-white/10 w-3/4" />
            <div className="h-3.5 rounded bg-white/10 w-2/3" />
            <div className="h-3.5 rounded bg-white/10 w-1/2" />
          </div>
        </div>
      )}

      {!state.isLoading && state.error && (
        <ErrorBanner message={state.error} onRetry={handleRetry} />
      )}

      {!state.isLoading && !state.error && slices.length === 0 && (
        <div className="py-8 text-center my-auto">
          <p className="text-sm text-zinc-400">
            Todavía no hay cosechas aprobadas con uvas cargadas.
          </p>
        </div>
      )}

      {!state.isLoading && !state.error && state.data && slices.length > 0 && (
        <>
          <div className="flex flex-col items-center gap-5 my-auto">
            <div className="relative w-56 h-56 shrink-0 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                className="w-full h-full -rotate-90 overflow-visible"
                role="img"
                aria-label={donutAriaLabel}
              >
                <circle
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={DONUT_STROKE_WIDTH}
                />
                {slices.map((slice, index) => {
                  const priorPercent = slices
                    .slice(0, index)
                    .reduce((acc, item) => acc + item.percent, 0);
                  const segmentLength = (slice.percent / 100) * DONUT_CIRCUMFERENCE;
                  const offset = -(priorPercent / 100) * DONUT_CIRCUMFERENCE;
                  const isActive = activeSlice?.label === slice.label;
                  const isDimmed = activeSlice !== null && !isActive;

                  return (
                    <circle
                      key={slice.label}
                      data-testid={`grape-slice-${slice.label}`}
                      cx={DONUT_CENTER}
                      cy={DONUT_CENTER}
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isActive ? DONUT_ACTIVE_STROKE_WIDTH : DONUT_STROKE_WIDTH}
                      strokeDasharray={`${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`}
                      strokeDashoffset={offset}
                      opacity={isDimmed ? 0.32 : 1}
                      className="cursor-pointer transition-all duration-200"
                      style={
                        isActive
                          ? { filter: `drop-shadow(0 0 8px ${slice.color}66)` }
                          : undefined
                      }
                      onMouseEnter={() => setHoveredLabel(slice.label)}
                      onMouseLeave={() => setHoveredLabel(null)}
                      onClick={() => handleTogglePin(slice.label)}
                    />
                  );
                })}
              </svg>

              <div
                data-testid="grape-donut-center"
                className="absolute inset-8 rounded-full flex flex-col items-center justify-center text-center pointer-events-none px-3"
              >
                {activeSlice ? (
                  <>
                    <span
                      className="text-3xl font-serif font-bold leading-none tabular-nums"
                      style={{ color: activeSlice.color }}
                    >
                      {activeSlice.percent}%
                    </span>
                    <span className="mt-1.5 text-xs font-medium text-zinc-100 leading-tight line-clamp-2 max-w-full">
                      {activeSlice.label}
                    </span>
                    <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      {formatCountLabel(activeSlice.count)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-serif font-bold text-zinc-100 leading-none tabular-nums">
                      {state.data.totalVintages}
                    </span>
                    <span className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                      cosechas
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="w-full space-y-2">
              <ul
                data-testid="grapes-legend-list"
                className={cn(
                  'w-full space-y-1',
                  showAll &&
                    'max-h-60 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]',
                )}
              >
                {visibleSlices.map((slice) => {
                  const isActive = activeSlice?.label === slice.label;
                  const isDimmed = activeSlice !== null && !isActive;

                  return (
                    <li key={slice.label}>
                      <button
                        type="button"
                        aria-pressed={pinnedLabel === slice.label}
                        onMouseEnter={() => setHoveredLabel(slice.label)}
                        onMouseLeave={() => setHoveredLabel(null)}
                        onClick={() => handleTogglePin(slice.label)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-left transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60',
                          isActive
                            ? 'border-white/15 bg-white/[0.06]'
                            : 'border-transparent hover:bg-white/[0.04]',
                          isDimmed && 'opacity-50',
                        )}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              'w-2.5 h-2.5 rounded-full shrink-0 transition-transform',
                              isActive && 'scale-125',
                            )}
                            style={{ backgroundColor: slice.color }}
                            aria-hidden="true"
                          />
                          <span className="text-zinc-200 truncate">{slice.label}</span>
                        </span>
                        <span
                          className="font-mono text-xs font-medium shrink-0 tabular-nums"
                          style={{ color: slice.color }}
                        >
                          {slice.percent}% ({slice.count})
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={handleToggleShowAll}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span>{showAll ? 'Ver menos' : `Ver ${hiddenCount} más`}</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-150',
                      showAll && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>

          <p className="mt-auto text-[11px] text-zinc-500 pt-2 border-t border-white/5">
            Una cosecha puede tener más de una uva.
          </p>
        </>
      )}
    </section>
  );
}
