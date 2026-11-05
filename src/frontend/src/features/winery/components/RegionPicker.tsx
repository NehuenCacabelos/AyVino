import { useState, useEffect, useMemo, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ListFilter, Map, RotateCw, AlertCircle, Loader2 } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { resolveLocation, getStates, getCities } from '../api/locationApi';
import type { RegionPickerValue, StateResponseDto, CityResponseDto } from '../types';

// Solución al empaquetado de íconos de Leaflet en Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface RegionPickerProps {
  value?: RegionPickerValue | null;
  onChange: (value: RegionPickerValue | null) => void;
  error?: string | null;
  disabled?: boolean;
  initialCoordinates?: { latitude: number; longitude: number } | null;
  initialLocationText?: string | null;
}

// Centro geográfico aproximado de la República Argentina
const ARGENTINA_CENTER: [number, number] = [-38.416097, -63.616672];
const DEFAULT_ZOOM = 5;

/**
 * Controlador de eventos internos del mapa Leaflet
 */
function MapEventsController({
  markerPosition,
  onMapClick,
  onMarkerDragEnd,
  disabled,
}: {
  markerPosition: [number, number] | null;
  onMapClick: (lat: number, lon: number) => void;
  onMarkerDragEnd: (lat: number, lon: number) => void;
  disabled: boolean;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    if (markerPosition) {
      map.panTo(markerPosition, { animate: true });
    }
  }, [markerPosition, map]);

  return markerPosition ? (
    <Marker
      position={markerPosition}
      draggable={!disabled}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onMarkerDragEnd(pos.lat, pos.lng);
        },
      }}
    />
  ) : null;
}

/**
 * Componente RegionPicker
 * Permite seleccionar el terruño oficial de una bodega mediante:
 * 1. Pin interactivo en mapa Leaflet (resolución por API oficial Georef).
 * 2. Respaldo manual en cascada: Provincia -> Región con buscador en vivo.
 */
export default function RegionPicker({
  value,
  onChange,
  error,
  disabled = false,
  initialCoordinates,
  initialLocationText,
}: RegionPickerProps) {
  const [mode, setMode] = useState<'map' | 'manual'>('map');

  // Estado del Mapa
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const valLat = value?.latitude;
  const valLon = value?.longitude;
  const initLat = initialCoordinates?.latitude;
  const initLon = initialCoordinates?.longitude;

  const activeMarkerPosition: [number, number] | null =
    markerPosition ??
    (valLat && valLon ? [valLat, valLon] : null) ??
    (initLat && initLon ? [initLat, initLon] : null);

  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<{
    message: string;
    status?: number;
    retryCoords?: { lat: number; lon: number };
  } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Estado del Respaldo Manual
  const [states, setStates] = useState<StateResponseDto[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  const [cities, setCities] = useState<CityResponseDto[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [regionFilterText, setRegionFilterText] = useState('');
  const [manualLoadError, setManualLoadError] = useState<string | null>(null);

  // Cargar provincias cuando se activa el modo manual por primera vez
  useEffect(() => {
    if (mode !== 'manual' || states.length > 0) return;

    let isMounted = true;
    Promise.resolve().then(async () => {
      setIsLoadingStates(true);
      setManualLoadError(null);

      try {
        const data = await getStates();
        if (isMounted) setStates(data);
      } catch (err: unknown) {
        if (isMounted) {
          setManualLoadError(
            err instanceof Error ? err.message : 'No se pudieron cargar las provincias.',
          );
        }
      } finally {
        if (isMounted) setIsLoadingStates(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mode, states.length]);

  // Cargar ciudades/regiones cuando cambia la provincia seleccionada
  useEffect(() => {
    if (!selectedStateId) {
      return;
    }

    let isMounted = true;
    Promise.resolve().then(async () => {
      setIsLoadingCities(true);
      setManualLoadError(null);
      setRegionFilterText('');

      try {
        const data = await getCities({ stateId: selectedStateId, pageSize: 250 });
        if (isMounted) setCities(data);
      } catch (err: unknown) {
        if (isMounted) {
          setManualLoadError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las regiones de la provincia.',
          );
        }
      } finally {
        if (isMounted) setIsLoadingCities(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedStateId]);

  // Ejecución de la resolución de coordenadas contra el backend
  const handleResolveCoords = useCallback(
    async (lat: number, lon: number) => {
      if (disabled || isResolving) return;

      setIsResolving(true);
      setResolveError(null);
      setGeoNotice(null);
      setMarkerPosition([lat, lon]);

      try {
        const resolved = await resolveLocation(lat, lon);
        onChange({
          mode: 'map',
          latitude: lat,
          longitude: lon,
          locationId: resolved.locationId,
          regionName: resolved.regionName,
          stateName: resolved.stateName,
          municipalityName: resolved.municipalityName,
        });
      } catch (err: unknown) {
        let status: number | undefined;
        let detail: string | undefined;

        if (isAxiosError<{ detail?: string; title?: string }>(err)) {
          status = err.response?.status;
          detail = err.response?.data?.detail ?? err.response?.data?.title;
        }

        if (status === 422) {
          setResolveError({
            message:
              detail ?? 'No pudimos ubicar ese punto en Argentina. Probá marcando otro lugar.',
            status: 422,
          });
        } else if (status === 503) {
          setResolveError({
            message:
              'El servicio oficial de resolución geográfica no se encuentra disponible. Podés elegir tu región desde la lista manual.',
            status: 503,
            retryCoords: { lat, lon },
          });
        } else if (status === 429) {
          setResolveError({
            message:
              'Llegaste al límite de consultas por minuto. Esperá unos segundos antes de volver a intentar.',
            status: 429,
            retryCoords: { lat, lon },
          });
        } else {
          setResolveError({
            message:
              detail ??
              'No se pudo conectar con el servidor para resolver la ubicación. Revisá tu conexión y volvé a intentar.',
            status,
            retryCoords: { lat, lon },
          });
        }
      } finally {
        setIsResolving(false);
      }
    },
    [disabled, isResolving, onChange],
  );

  // Botón "Usar mi ubicación"
  const handleUseMyLocation = () => {
    if (disabled || isResolving || isLocating) return;

    if (!('geolocation' in navigator)) {
      setGeoNotice('La geolocalización no está disponible en este navegador.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        handleResolveCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoNotice('Permiso de ubicación denegado. Podés marcar el pin directamente en el mapa.');
        } else {
          setGeoNotice('No se pudo determinar tu ubicación actual.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Filtrado de ciudades en el selector manual
  const filteredCities = useMemo(() => {
    if (!regionFilterText.trim()) return cities;
    const lower = regionFilterText.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(lower));
  }, [cities, regionFilterText]);

  const handleManualStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value ? Number(e.target.value) : null;
    setSelectedStateId(sId);
    onChange(null);
  };

  const handleManualCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value ? Number(e.target.value) : null;
    if (!cId) {
      onChange(null);
      return;
    }

    const city = cities.find((c) => c.id === cId);
    const state = states.find((s) => s.id === selectedStateId);

    if (city && state) {
      onChange({
        mode: 'manual',
        locationId: city.id,
        regionName: city.name,
        stateName: state.name,
      });
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Barra de cabecera con toggle de modo */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          {mode === 'map' ? 'Mapa de ubicación oficial' : 'Selección manual de región'}
        </label>

        <button
          type="button"
          disabled={disabled || isResolving}
          onClick={() => {
            setMode((prev) => (prev === 'map' ? 'manual' : 'map'));
            setResolveError(null);
            setGeoNotice(null);
          }}
          className="text-xs text-amber-200/90 hover:text-amber-100 flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-300 rounded px-1.5 py-0.5"
          aria-label={
            mode === 'map'
              ? 'Cambiar a selección manual por lista'
              : 'Cambiar a selección por mapa interactivo'
          }
        >
          {mode === 'map' ? (
            <>
              <ListFilter className="w-3.5 h-3.5" />
              <span>Prefiero elegirla de una lista</span>
            </>
          ) : (
            <>
              <Map className="w-3.5 h-3.5" />
              <span>Prefiero marcarla en el mapa</span>
            </>
          )}
        </button>
      </div>

      {mode === 'map' ? (
        <div className="space-y-3">
          {/* Contenedor del Mapa Leaflet */}
          <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 bg-[#0f0f11] shadow-inner">
            <MapContainer
              center={activeMarkerPosition ?? ARGENTINA_CENTER}
              zoom={activeMarkerPosition ? 11 : DEFAULT_ZOOM}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
              style={{ minHeight: '100%', background: '#121214' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEventsController
                markerPosition={activeMarkerPosition}
                onMapClick={handleResolveCoords}
                onMarkerDragEnd={handleResolveCoords}
                disabled={disabled || isResolving}
              />
            </MapContainer>

            {/* Overlay de carga mientras se resuelve con Georef */}
            {isResolving && (
              <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-zinc-100">
                <Loader2 className="w-7 h-7 text-amber-200 animate-spin" />
                <span className="text-xs font-mono tracking-wider text-amber-200/90">
                  Resolviendo región oficial con Georef...
                </span>
              </div>
            )}

            {/* Botón flotante: Usar mi ubicación */}
            <div className="absolute bottom-3 right-3 z-[999]">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={disabled || isResolving || isLocating}
                className="h-10 px-3.5 rounded-xl bg-[#141416]/95 hover:bg-[#1a1a1e] border border-white/15 text-zinc-200 text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                aria-label="Usar mi ubicación geográfica actual"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-200" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-amber-200" />
                )}
                <span>{isLocating ? 'Obteniendo GPS...' : 'Usar mi ubicación'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 pl-1">
            Tocá el mapa o arrastrá el marcador para fijar la ubicación exacta de tu bodega o viñedo.
          </p>
        </div>
      ) : (
        /* Selector manual Provincia -> Región */
        <div className="space-y-3.5 p-4 rounded-2xl bg-[#121214] border border-white/10">
          <div>
            <label
              htmlFor="region-picker-state"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
            >
              Provincia vitivinícola
            </label>
            <select
              id="region-picker-state"
              value={selectedStateId ?? ''}
              onChange={handleManualStateChange}
              disabled={disabled || isLoadingStates}
              aria-label="Provincia vitivinícola"
              className="h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/60 hover:bg-zinc-900/80 text-zinc-100 border border-zinc-800/80 focus:border-zinc-500 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-[#141416] text-zinc-400">
                {isLoadingStates ? 'Cargando provincias...' : 'Seleccioná la provincia'}
              </option>
              {states.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#141416] text-zinc-100">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {selectedStateId && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="region-picker-city"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
                >
                  Región oficial
                </label>
                {cities.length > 8 && (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {cities.length} regiones disponibles
                  </span>
                )}
              </div>

              {/* Buscador de región si la lista es extensa */}
              {cities.length > 6 && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={regionFilterText}
                    onChange={(e) => setRegionFilterText(e.target.value)}
                    placeholder="Filtrar región por nombre..."
                    aria-label="Filtrar región por nombre"
                    disabled={disabled || isLoadingCities}
                    className="h-10 w-full rounded-xl px-3 text-xs bg-zinc-900/40 text-zinc-200 border border-zinc-800/60 focus:border-zinc-500 focus:outline-none placeholder:text-zinc-500 transition-colors"
                  />
                </div>
              )}

              <select
                id="region-picker-city"
                value={value?.locationId ?? ''}
                onChange={handleManualCityChange}
                disabled={disabled || isLoadingCities}
                aria-label="Región oficial"
                className="h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/60 hover:bg-zinc-900/80 text-zinc-100 border border-zinc-800/80 focus:border-zinc-500 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#141416] text-zinc-400">
                  {isLoadingCities ? 'Cargando regiones...' : 'Seleccioná la región'}
                </option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#141416] text-zinc-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {manualLoadError && (
            <p className="text-[11px] text-rose-400 pl-1">{manualLoadError}</p>
          )}
        </div>
      )}

      {/* Notificación de Geoubicación del navegador */}
      {geoNotice && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
          <span>{geoNotice}</span>
        </div>
      )}

      {/* Manejo de errores de resolución (422, 503, 429) */}
      {resolveError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{resolveError.message}</span>
          </div>

          <div className="flex items-center gap-2 pl-6 pt-1">
            {resolveError.retryCoords && (
              <button
                type="button"
                onClick={() =>
                  handleResolveCoords(
                    resolveError.retryCoords!.lat,
                    resolveError.retryCoords!.lon,
                  )
                }
                className="h-7 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-medium text-rose-200 flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-300"
                aria-label="Reintentar resolución de ubicación"
              >
                <RotateCw className="w-3 h-3" />
                <span>Reintentar</span>
              </button>
            )}

            {resolveError.status === 503 && mode === 'map' && (
              <button
                type="button"
                onClick={() => setMode('manual')}
                className="h-7 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-medium text-amber-200 flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-300"
              >
                <ListFilter className="w-3 h-3" />
                <span>Ir al selector manual</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmación Editorial de la Región Elegida */}
      {value && value.regionName ? (
        <div className="rounded-xl border border-amber-200/25 bg-amber-500/5 p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-200 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/70 block">
              Región confirmada
            </span>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">
              Tu bodega está en:{' '}
              <span className="text-amber-200">
                {value.regionName}, {value.stateName}
              </span>
            </p>
            {value.municipalityName && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Municipio / Localidad: {value.municipalityName}
              </p>
            )}
          </div>
        </div>
      ) : initialLocationText ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex items-start gap-3 text-xs text-zinc-300">
          <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Ubicación actual
            </span>
            <p className="text-zinc-200 font-medium">{initialLocationText}</p>
          </div>
        </div>
      ) : null}

      {/* Error de validación del formulario */}
      {error && !value && <p className="text-[11px] text-rose-400 pl-1">{error}</p>}
    </div>
  );
}
