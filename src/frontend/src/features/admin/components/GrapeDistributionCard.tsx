import { useCallback, useEffect, useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';
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

const DONUT_SIZE = 176;
const DONUT_CENTER = DONUT_SIZE / 2;
const DONUT_RADIUS = 64;
const DONUT_STROKE_WIDTH = 22;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function formatSubtitle(totalVintages: number): string {
  return totalVintages === 1
    ? 'Participación enológica de 1 cosecha aprobada.'
    : `Participación enológica de las ${totalVintages} cosechas aprobadas.`;
}

export default function GrapeDistributionCard({ className }: { className?: string }) {
  const [state, setState] = useState<FetchState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);

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
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setFetchKey((prev) => prev + 1);
  }, []);

  const slices = useMemo(
    () => (state.data ? buildGrapeSlices(state.data) : []),
    [state.data],
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
        'rounded-2xl border border-white/10 bg-[#121015] p-5 flex flex-col justify-between gap-4',
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
          <div className="w-44 h-44 rounded-full border-[22px] border-white/10 shrink-0" />
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
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                className="w-full h-full -rotate-90"
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

                  return (
                    <circle
                      key={slice.label}
                      cx={DONUT_CENTER}
                      cy={DONUT_CENTER}
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={DONUT_STROKE_WIDTH}
                      strokeDasharray={`${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-serif font-bold text-zinc-100 leading-none tabular-nums">
                  {state.data.totalVintages}
                </span>
                <span className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  cosechas
                </span>
              </div>
            </div>

            <ul className="w-full space-y-2.5">
              {slices.map((slice) => (
                <li
                  key={slice.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
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
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-zinc-500 pt-2 border-t border-white/5">
            Una cosecha puede tener más de una uva.
          </p>
        </>
      )}
    </section>
  );
}
