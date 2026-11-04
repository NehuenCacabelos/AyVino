import type { WineryMapCenterDto, MapPrecision } from '../types';

export const STATIC_PROVINCE_CENTROIDS: Record<string, [number, number]> = {
  mendoza: [-34.6297, -68.5833],
  'san juan': [-30.8654, -68.8895],
  salta: [-24.7859, -65.4117],
  'la rioja': [-29.4131, -66.8558],
  catamarca: [-28.4696, -65.7852],
  neuquen: [-38.9516, -68.0591],
  'rio negro': [-39.0333, -67.5833],
  chubut: [-43.7886, -68.5264],
  'buenos aires': [-36.6769, -60.5588],
  cordoba: [-31.4201, -64.1888],
  'entre rios': [-32.0589, -59.2014],
  'santa fe': [-30.7069, -60.9499],
  tucuman: [-26.9478, -65.3648],
  jujuy: [-23.3199, -65.7644],
  'san luis': [-33.7577, -66.0276],
  'la pampa': [-36.6167, -64.2833],
  corrientes: [-28.7743, -57.7818],
  misiones: [-26.8754, -54.3001],
  chaco: [-26.3864, -60.7658],
  formosa: [-24.8950, -59.9324],
  'santiago del estero': [-27.7824, -64.2642],
  'santa cruz': [-48.8715, -69.9558],
  'tierra del fuego': [-54.3413, -67.7426],
  caba: [-34.6037, -58.3816],
  'ciudad autonoma de buenos aires': [-34.6037, -58.3816],
};

export const ARGENTINA_CENTER: [number, number] = [-38.4161, -63.6167];

export interface ResolvedMapCenterState {
  center: [number, number];
  precision: MapPrecision;
  zoom: number;
  showMarker: boolean;
}

export function resolveMapCenter(
  mapCenter?: WineryMapCenterDto | null,
  latitude?: number | null,
  longitude?: number | null,
  provinceName?: string | null,
  locationLabel?: string | null
): ResolvedMapCenterState {
  // 1. Centro provisto por el backend (con mejor resolución disponible)
  if (
    mapCenter &&
    typeof mapCenter.latitude === 'number' &&
    typeof mapCenter.longitude === 'number' &&
    !isNaN(mapCenter.latitude) &&
    !isNaN(mapCenter.longitude)
  ) {
    const lat = Number(mapCenter.latitude);
    const lon = Number(mapCenter.longitude);
    const precision = mapCenter.precision;
    const zoom =
      precision === 'exact' ? 12 : precision === 'locality' ? 10 : precision === 'province' ? 6 : 4;
    const showMarker = precision === 'exact' || precision === 'locality';
    return { center: [lat, lon], precision, zoom, showMarker };
  }

  // 2. Coordenadas exactas directas en props
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  ) {
    return {
      center: [Number(latitude), Number(longitude)],
      precision: 'exact',
      zoom: 12,
      showMarker: true,
    };
  }

  // 3. Fallback estático por provincia
  const provToTry =
    provinceName || (locationLabel ? locationLabel.split(',').pop()?.trim() : null);
  if (provToTry) {
    const normalized = provToTry
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (STATIC_PROVINCE_CENTROIDS[normalized]) {
      return {
        center: STATIC_PROVINCE_CENTROIDS[normalized],
        precision: 'province',
        zoom: 6,
        showMarker: false,
      };
    }
  }

  // 4. Fallback final nacional sin marcador
  return {
    center: ARGENTINA_CENTER,
    precision: 'none',
    zoom: 4,
    showMarker: false,
  };
}
