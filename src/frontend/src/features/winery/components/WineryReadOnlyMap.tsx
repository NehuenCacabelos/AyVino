import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';

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
  locationLabel?: string;
  className?: string;
}

/**
 * Componente de mapa de solo lectura para la bodega.
 * Si cuenta con coordenadas, muestra el pin interactivo en OpenStreetMap.
 * Si no cuenta con coordenadas, muestra un estado elegante indicando solo la región geográfica.
 */
export default function WineryReadOnlyMap({
  latitude,
  longitude,
  locationLabel = 'Argentina',
  className,
}: WineryReadOnlyMapProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  if (hasCoordinates) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    return (
      <div
        data-testid="winery-map-container"
        className={cn('rounded-xl overflow-hidden border border-white/10 shadow-inner', className)}
      >
        <MapContainer
          center={[lat, lon]}
          zoom={12}
          scrollWheelZoom={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-48 sm:h-56 rounded-xl z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lon]} />
        </MapContainer>
        <div className="bg-[#121015] px-3.5 py-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
          <span className="shrink-0 text-zinc-500">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="winery-map-fallback"
      className={cn(
        'p-6 rounded-xl bg-[#121015]/60 border border-white/5 text-center space-y-2 flex flex-col items-center justify-center min-h-[140px]',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
        <MapPin className="w-5 h-5 text-rose-400/80" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">{locationLabel}</p>
        <p className="text-xs text-zinc-500 font-sans mt-0.5">
          Esta bodega no tiene coordenadas geográficas exactas registradas.
        </p>
      </div>
    </div>
  );
}
