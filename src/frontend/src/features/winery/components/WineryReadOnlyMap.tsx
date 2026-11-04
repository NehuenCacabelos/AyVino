import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { WineryMapCenterDto } from '../types';
import { resolveMapCenter } from '../utils/wineryMapUtils';

// Configuración de íconos de Leaflet en Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface WineryReadOnlyMapProps {
  latitude?: number | null;
  longitude?: number | null;
  mapCenter?: WineryMapCenterDto | null;
  provinceName?: string | null;
  locationLabel?: string;
  className?: string;
}

/**
 * Componente de mapa de solo lectura para la bodega.
 * Garantiza que el mapa siempre se dibuje con la mejor precisión disponible:
 * - exact: centrado en la finca con marcador y zoom de detalle.
 * - locality: centrado en la localidad con marcador y rótulo "Ubicación aproximada".
 * - province: centrado en la provincia sin marcador con zoom amplio.
 * - none: mapa de Argentina general sin marcador.
 */
export default function WineryReadOnlyMap({
  latitude,
  longitude,
  mapCenter,
  provinceName,
  locationLabel = 'Argentina',
  className,
}: WineryReadOnlyMapProps) {
  const { center, precision, zoom, showMarker } = resolveMapCenter(
    mapCenter,
    latitude,
    longitude,
    provinceName,
    locationLabel
  );

  return (
    <div
      data-testid="winery-map-container"
      className={cn('rounded-xl overflow-hidden border border-white/10 shadow-inner bg-[#0a0a0c]', className)}
    >
      <MapContainer
        key={`${center[0]}-${center[1]}-${zoom}`}
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-48 sm:h-56 rounded-xl z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {showMarker && <Marker position={center} />}
      </MapContainer>
      <div className="bg-[#121015] px-3.5 py-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {precision === 'locality' && (
            <span className="text-[10px] text-amber-300/90 font-medium bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded-full">
              Ubicación aproximada
            </span>
          )}
          {precision === 'province' && (
            <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              Vista provincial
            </span>
          )}
          {precision === 'none' && (
            <span className="text-[10px] text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              Vista general
            </span>
          )}
          {precision === 'exact' && (
            <span className="text-zinc-500">
              {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
