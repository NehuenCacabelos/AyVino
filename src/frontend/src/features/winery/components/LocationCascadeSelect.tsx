import { useState, useEffect, useMemo } from 'react';
import { getStates, getLocations } from '../api/locationApi';
import type { StateResponseDto, LocationResponseDto } from '../types';

export interface LocationCascadeSelectProps {
  value: number | null;
  onChange: (locationId: number | null) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Selector de ubicación en cascada (Provincia -> Ciudad / Terruño -> LocationId).
 * Diseñado con la estética Clean Dark de los formularios de AyVino (h-12, rounded-xl).
 */
export default function LocationCascadeSelect({
  value,
  onChange,
  error,
  disabled = false,
}: LocationCascadeSelectProps) {
  const [states, setStates] = useState<StateResponseDto[]>([]);
  const [locations, setLocations] = useState<LocationResponseDto[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getStates(), getLocations({ pageSize: 100 })])
      .then(([statesData, locationsData]) => {
        if (!isMounted) return;
        setStates(statesData);
        setLocations(locationsData);

        // Si ya hay un LocationId seleccionado inicialmente, sincronizar la provincia
        if (value) {
          const match = locationsData.find((loc) => loc.id === value);
          if (match) {
            setSelectedStateId(match.stateId);
          }
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las provincias y ubicaciones del servidor.',
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  // Filtrar las ubicaciones disponibles según la provincia seleccionada
  const availableLocations = useMemo(() => {
    if (!selectedStateId) return [];
    return locations.filter((loc) => loc.stateId === selectedStateId);
  }, [locations, selectedStateId]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value ? Number(e.target.value) : null;
    setSelectedStateId(stateId);
    // Reiniciar la ubicación seleccionada al cambiar de provincia
    onChange(null);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value ? Number(e.target.value) : null;
    onChange(locId);
  };

  return (
    <div className="space-y-3.5">
      {/* Selector de Provincia */}
      <div>
        <select
          id="winery-state"
          value={selectedStateId ?? ''}
          onChange={handleStateChange}
          disabled={disabled || isLoading}
          aria-label="Provincia vitivinícola"
          className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 border focus:outline-none focus:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            error && !selectedStateId
              ? 'border-rose-500/70 focus:border-rose-500'
              : 'border-zinc-800/80 focus:border-zinc-500'
          }`}
        >
          <option value="" className="bg-[#141416] text-zinc-400">
            {isLoading ? 'Cargando provincias...' : 'Seleccioná la provincia'}
          </option>
          {states.map((state) => (
            <option key={state.id} value={state.id} className="bg-[#141416] text-zinc-100">
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Ciudad / Terruño (Location) */}
      <div>
        <select
          id="winery-location"
          value={value ?? ''}
          onChange={handleLocationChange}
          disabled={disabled || isLoading || !selectedStateId}
          aria-label="Ciudad o terruño de la bodega"
          className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 border focus:outline-none focus:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            error && !value
              ? 'border-rose-500/70 focus:border-rose-500'
              : 'border-zinc-800/80 focus:border-zinc-500'
          }`}
        >
          <option value="" className="bg-[#141416] text-zinc-400">
            {!selectedStateId
              ? 'Primero elegí una provincia'
              : availableLocations.length === 0
                ? 'Sin regiones cargadas para esta provincia'
                : 'Seleccioná la ciudad o región'}
          </option>
          {availableLocations.map((loc) => (
            <option key={loc.id} value={loc.id} className="bg-[#141416] text-zinc-100">
              {loc.cityName}
            </option>
          ))}
        </select>

        {error && <p className="text-[11px] text-rose-400 mt-1 pl-1">{error}</p>}
        {loadError && <p className="text-[11px] text-amber-400/90 mt-1 pl-1">{loadError}</p>}
      </div>
    </div>
  );
}

