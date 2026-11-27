import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronDown, ExternalLink, Map as MapIcon, MapPin } from 'lucide-react';
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
const REGION_BAR_COLORS = ['#fb7185', '#fbbf24', '#34d399', '#f97316', '#38bdf8'] as const;

const BARREL_ICON_HTML = `
  <div class="ayvino-barrel-pin" style="width:28px;height:28px;border-radius:9999px;background:#161015;border:1.5px solid #fb7185;box-shadow:0 2px 10px rgba(251,113,133,0.45);display:flex;align-items:center;justify-content:center;transition:transform 150ms ease;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4.5h9c1.8 2.2 2.5 4.8 2.5 7.5s-.7 5.3-2.5 7.5h-9C5.7 17.3 5 14.7 5 12s.7-5.3 2.5-7.5Z" fill="#722f37" stroke="#fda4af" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M5.6 8.5h12.8M5.6 15.5h12.8" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M12 4.5v15" stroke="#fda4af" stroke-width="1" stroke-opacity="0.55"/>
    </svg>
  </div>
`;

function createBarrelIcon(): L.DivIcon {
  return L.divIcon({
    className: 'ayvino-barrel-marker',
    html: BARREL_ICON_HTML,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14],
    popupAnchor: [0, -14],
  });
}

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

function formatWineryCountLabel(count: number): string {
  return count === 1 ? '1 bodega' : `${count} bodegas`;
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
    map.fitBounds(bounds, {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 72],
      maxZoom: 12,
    });
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
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  const barrelIcon = useMemo(() => createBarrelIcon(), []);

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
    setSelectedStateId(null);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setFetchKey((prev) => prev + 1);
  }, []);

  const handleToggleRegion = useCallback((stateId: number) => {
    setSelectedStateId((prev) => (prev === stateId ? null : stateId));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedStateId(null);
  }, []);

  const regionRowsResult = useMemo(
    () =>
      state.data
        ? buildRegionRows(state.data.regions, state.data.totalWineries)
        : { rows: [], restCount: 0 },
    [state.data],
  );

  const selectedRegion = useMemo(
    () =>
      selectedStateId === null
        ? null
        : regionRowsResult.rows.find((row) => row.stateId === selectedStateId) ?? null,
    [regionRowsResult.rows, selectedStateId],
  );

  const filteredPins = useMemo(() => {
    if (!state.data) {
      return [];
    }
    if (selectedRegion === null) {
      return state.data.pins;
    }

    return state.data.pins.filter((pin) =>
      pin.stateId !== undefined && pin.stateId !== null
        ? pin.stateId === selectedRegion.stateId
        : pin.stateName === selectedRegion.stateName,
    );
  }, [state.data, selectedRegion]);

  const selectedWineries = useMemo(() => {
    if (!state.data?.wineries || selectedRegion === null) {
      return [];
    }

    return state.data.wineries.filter((winery) => winery.stateId === selectedRegion.stateId);
  }, [state.data, selectedRegion]);

  const data = state.data;
  const hasApprovedWineries = Boolean(data && data.totalWineries > 0);
  const leadRegion = regionRowsResult.rows[0] ?? null;
  const overlayRegion = selectedRegion ?? leadRegion;

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-[#121015] p-5 flex flex-col justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-400/90">
            Geografía enológica
          </p>
          <h2 className="mt-1 text-lg font-serif font-semibold text-zinc-100">
            Regiones y Terruños
          </h2>
        </div>
        <MapIcon className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
      </div>

      {state.isLoading && (
        <div
          data-testid="wineries-regions-loading"
          aria-busy="true"
          className="space-y-4 animate-pulse"
        >
          <div className="h-56 w-full rounded-xl bg-white/10" />
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
        <div className="py-8 text-center my-auto">
          <p className="text-sm text-zinc-400">Todavía no hay bodegas aprobadas.</p>
        </div>
      )}

      {!state.isLoading && !state.error && data && hasApprovedWineries && (
        <div className="space-y-4">
          {filteredPins.length > 0 && (
            <div
              data-testid="wineries-regions-map-wrapper"
              className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d0c10]"
            >
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={false}
                attributionControl={true}
                className="w-full h-56 z-0 [&_.leaflet-tile-pane]:brightness-[0.82] [&_.leaflet-tile-pane]:contrast-[1.08] [&_.leaflet-tile-pane]:saturate-[0.75] [&_.leaflet-bottom.leaflet-right]:bottom-auto [&_.leaflet-bottom.leaflet-right]:top-0 [&_.leaflet-control-attribution]:!bg-black/65 [&_.leaflet-control-attribution]:!text-zinc-400 [&_.leaflet-control-attribution_a]:!text-zinc-300 [&_.ayvino-barrel-marker:hover_.ayvino-barrel-pin]:scale-125 [&_.leaflet-tooltip]:!bg-[#121015]/95 [&_.leaflet-tooltip]:!border [&_.leaflet-tooltip]:!border-white/15 [&_.leaflet-tooltip]:!text-zinc-100 [&_.leaflet-tooltip]:!rounded-xl [&_.leaflet-tooltip]:!px-3 [&_.leaflet-tooltip]:!py-2 [&_.leaflet-tooltip]:!shadow-xl [&_.leaflet-tooltip]:!backdrop-blur-md [&_.leaflet-tooltip-top::before]:!border-t-[#121015]/95"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBoundsToPins pins={filteredPins} />
                {filteredPins.map((pin) => {
                  const locationLabel = formatPinLocation(pin.cityName, pin.stateName);

                  return (
                    <Marker
                      key={pin.id}
                      position={[pin.latitude, pin.longitude]}
                      icon={barrelIcon}
                    >
                      <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                        <div className="min-w-[120px]">
                          <p className="font-serif text-xs font-semibold text-zinc-100 leading-tight">
                            {pin.name}
                          </p>
                          {locationLabel && (
                            <p className="mt-0.5 font-mono text-[10px] text-emerald-400/90">
                              {locationLabel}
                            </p>
                          )}
                        </div>
                      </Tooltip>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold text-zinc-900">{pin.name}</p>
                          {locationLabel && (
                            <p className="text-zinc-600">{locationLabel}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {overlayRegion && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] bg-gradient-to-t from-[#121015] via-[#121015]/85 to-transparent px-4 pt-8 pb-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/90">
                      {selectedRegion ? 'Provincia seleccionada' : 'Epicentro vitivinícola'}
                    </p>
                    <p className="mt-0.5 text-base font-serif font-semibold text-zinc-100 truncate">
                      {overlayRegion.stateName}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-white/10 bg-black/65 backdrop-blur-sm px-2.5 py-1.5 text-right">
                    <p className="text-sm font-serif font-semibold text-zinc-100 leading-none tabular-nums">
                      {overlayRegion.wineryCount}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                      {overlayRegion.wineryCount === 1 ? 'Bodega' : 'Bodegas'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedRegion && filteredPins.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0d0c10] px-4 py-6 text-center space-y-2">
              <MapPin className="w-5 h-5 text-zinc-500 mx-auto" aria-hidden="true" />
              <p className="text-xs text-zinc-300">
                Las bodegas de {selectedRegion.stateName} no tienen coordenadas cargadas para mostrar en el mapa.
              </p>
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Mostrar todas las bodegas
              </button>
            </div>
          )}

          {data.withoutCoordinates > 0 && (
            <p className="text-xs text-zinc-400">
              {formatMissingCoordinatesNote(data.withoutCoordinates)}
            </p>
          )}

          {regionRowsResult.rows.length > 0 && (
            <div className="space-y-3">
              <ul className="space-y-2">
                {regionRowsResult.rows.map((row, index) => {
                  const barColor = REGION_BAR_COLORS[index % REGION_BAR_COLORS.length];
                  const isSelected = selectedStateId === row.stateId;

                  return (
                    <li key={row.stateId}>
                      <button
                        type="button"
                        onClick={() => handleToggleRegion(row.stateId)}
                        aria-expanded={isSelected}
                        className={cn(
                          'w-full text-left rounded-xl px-2.5 py-2 transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                          isSelected
                            ? 'border-white/15 bg-white/[0.05]'
                            : 'border-transparent hover:bg-white/[0.03]',
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: barColor }}
                                aria-hidden="true"
                              />
                              <span className="text-zinc-200 font-medium truncate">
                                {row.stateName}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                                {formatWineryCountLabel(row.wineryCount)} / {row.percent}% del total
                              </span>
                              <ChevronDown
                                className={cn(
                                  'w-3.5 h-3.5 text-zinc-500 transition-transform duration-150',
                                  isSelected && 'rotate-180 text-zinc-200',
                                )}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, row.percent))}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      </button>

                      {isSelected && (
                        <div
                          data-testid={`region-dropdown-${row.stateId}`}
                          className="mt-1.5 ml-2 rounded-xl border border-white/10 bg-[#0d0c10]/90 px-3 py-2.5"
                        >
                          {selectedWineries.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                              No hay detalle de bodegas disponible para esta provincia.
                            </p>
                          ) : (
                            <ul className="divide-y divide-white/[0.06]">
                              {selectedWineries.map((winery) => (
                                <li
                                  key={winery.id}
                                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <Link
                                      to={`/bodegas/${winery.id}`}
                                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-100 hover:text-rose-300 transition-colors"
                                    >
                                      <span className="truncate">{winery.name}</span>
                                      <ExternalLink
                                        className="w-3 h-3 text-zinc-500 shrink-0"
                                        aria-hidden="true"
                                      />
                                    </Link>
                                    <p className="text-[11px] text-zinc-400 truncate">
                                      {winery.cityName ?? 'Ciudad sin especificar'}
                                      {winery.foundationYear ? ` · Est. ${winery.foundationYear}` : ''}
                                    </p>
                                  </div>
                                  <span
                                    className={cn(
                                      'shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px]',
                                      winery.hasCoordinates
                                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
                                    )}
                                  >
                                    {winery.hasCoordinates ? 'En mapa' : 'Sin mapa'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
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
