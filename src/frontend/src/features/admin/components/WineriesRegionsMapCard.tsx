import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getWineriesByRegion } from '../api/adminStatsApi';
import type { WineriesByRegion, WineryPin } from '../types/adminStats';
import { buildRegionRows } from '../utils/dashboardCharts';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import ErrorBanner from './ErrorBanner';
import { cn } from '../../../lib/utils';

interface FetchState {
  data: WineriesByRegion | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_CENTER: [number, number] = [-34.6, -64.0];
const DEFAULT_ZOOM = 4;

function formatPinLocation(cityName: string | null, stateName: string | null): string | null {
  const parts = [cityName, stateName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(', ') : null;
}

function formatMissingCoordinatesNote(count: number): string {
  return count === 1
    ? '1 bodega no tiene coordenadas y no aparece en el mapa.'
    : `${count} bodegas no tienen coordenadas y no aparecen en el mapa.`;
}

function FitBoundsToPins({ pins }: { pins: readonly WineryPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
  }, [map, pins]);

  return null;
}

export default function WineriesRegionsMapCard({ className }: { className?: string }) {
  const [state, setState] = useState<FetchState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getWineriesByRegion()
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

  const regionRowsResult = useMemo(
    () =>
      state.data
        ? buildRegionRows(state.data.regions, state.data.totalWineries)
        : { rows: [], restCount: 0 },
    [state.data],
  );

  const data = state.data;
  const hasApprovedWineries = Boolean(data && data.totalWineries > 0);

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-[#121015] p-5 flex flex-col justify-between gap-4',
        className,
      )}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          Geografía enológica
        </p>
        <h2 className="mt-1 text-lg font-serif font-semibold text-zinc-100">
          Regiones y mapa
        </h2>
      </div>

      {state.isLoading && (
        <div
          data-testid="wineries-regions-loading"
          aria-busy="true"
          className="space-y-4 animate-pulse"
        >
          <div className="h-64 w-full rounded-xl bg-white/10" />
          <div className="space-y-2.5">
            <div className="h-3.5 rounded bg-white/10 w-3/4" />
            <div className="h-3.5 rounded bg-white/10 w-2/3" />
            <div className="h-3.5 rounded bg-white/10 w-1/2" />
          </div>
        </div>
      )}

      {!state.isLoading && state.error && (
        <ErrorBanner message={state.error} onRetry={handleRetry} />
      )}

      {!state.isLoading && !state.error && !hasApprovedWineries && (
        <div className="py-8 text-center">
          <p className="text-sm text-zinc-400">Todavía no hay bodegas aprobadas.</p>
        </div>
      )}

      {!state.isLoading && !state.error && data && hasApprovedWineries && (
        <div className="space-y-4">
          {data.pins.length > 0 && (
            <div
              data-testid="wineries-regions-map-wrapper"
              className="rounded-xl overflow-hidden border border-white/10"
            >
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={false}
                attributionControl={true}
                className="w-full h-64 z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBoundsToPins pins={data.pins} />
                {data.pins.map((pin) => {
                  const locationLabel = formatPinLocation(pin.cityName, pin.stateName);

                  return (
                    <CircleMarker
                      key={pin.id}
                      center={[pin.latitude, pin.longitude]}
                      radius={7}
                      pathOptions={{
                        color: '#fb7185',
                        fillColor: '#fb7185',
                        fillOpacity: 0.75,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold text-zinc-900">{pin.name}</p>
                          {locationLabel && (
                            <p className="text-zinc-600">{locationLabel}</p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {data.withoutCoordinates > 0 && (
            <p className="text-xs text-zinc-400">
              {formatMissingCoordinatesNote(data.withoutCoordinates)}
            </p>
          )}

          {regionRowsResult.rows.length > 0 && (
            <div className="space-y-3">
              <ul className="space-y-2.5">
                {regionRowsResult.rows.map((row) => (
                  <li key={row.stateId} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-200 truncate">{row.stateName}</span>
                      <span className="font-mono text-xs text-zinc-400 shrink-0 tabular-nums">
                        {row.wineryCount} ({row.percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-400"
                        style={{
                          width: `${Math.min(100, Math.max(0, row.percent))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {regionRowsResult.restCount > 0 && (
                <p className="text-xs text-zinc-500">
                  y {regionRowsResult.restCount} provincias más
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
