import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Wine,
  Layers,
  Star,
  Settings,
  Eye,
  Compass,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useWinery } from '../features/winery/context/WineryContext';
import { useWineryCatalog } from '../features/winery/context/WineryCatalogContext';
import {
  getWines,
  getWineryPublicProfile,
  getLocationById,
} from '../features/winery/api';
import {
  WineryLogo,
  WineryTopBar,
  WineryStatusBanner,
  WineryBanner,
  type WineResponseDto,
} from '../features/winery';

// Configuración de íconos de Leaflet en Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * WineryOverviewPage Component (/bodega/perfil)
 * Ficha institucional oficial de la bodega con estética de ProfilePage:
 * - TopBar minimalista fija con vía de escape a /bodega/dashboard.
 * - Banner degradado vitivinícola determinista según el nombre de la bodega.
 * - Logo circular superpuesto con ring-4 y badges de estado oficial.
 * - Botones de acción: "Editar configuración" y "Ver cómo lo ven los usuarios" (siempre habilitado).
 * - Cinta de métricas: Seguidores, Etiquetas oficiales, Cosechas/Añadas y Puntaje.
 * - Terruño vitivinícola con mapa Leaflet de solo lectura y semblanza histórica.
 */
export default function WineryOverviewPage() {
  const { winery } = useWinery();
  const { catalog } = useWineryCatalog();

  const [winesFallback, setWinesFallback] = useState<WineResponseDto[]>([]);
  const [asyncLocationLabel, setAsyncLocationLabel] = useState<string | null>(null);

  const locationLabel = winery?.location
    ? `${winery.location.regionName}, ${winery.location.stateName}`
    : asyncLocationLabel;
  const [publicData, setPublicData] = useState<{
    followersCount: number | null;
    averageRating: number | null;
    totalReviews: number;
    vintagesCount: number;
  }>({
    followersCount: null,
    averageRating: null,
    totalReviews: 0,
    vintagesCount: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(() => Boolean(winery?.id));

  const isApproved = winery?.status === 'Approved';
  const isPending = winery?.status === 'Pending';
  const isRejected = winery?.status === 'Rejected';

  // Derivar etiquetas a partir del contexto del catálogo o del fallback
  const wines: WineResponseDto[] = (catalog?.wines && catalog.wines.length > 0)
    ? catalog.wines.map((w) => ({
        id: w.id,
        name: w.name,
        wineryId: winery?.id ?? null,
        wineryNameText: winery?.name ?? null,
        wineType: w.wineType,
        sourceType: w.sourceType,
        description: w.description ?? null,
        locationId: winery?.locationId ?? null,
        duplicateOfWineId: null,
        averageRating: w.averageRating ?? null,
        reviewCount: w.reviewCount,
      }))
    : winesFallback;

  const winesCount = catalog?.totals.labels ?? wines.length;
  const vintagesCount = catalog?.totals.vintages ?? publicData.vintagesCount;
  const followersCount = publicData.followersCount;
  const averageRating = publicData.averageRating;
  const totalReviews = publicData.totalReviews;

  const wineryId = winery?.id;
  const locationId = winery?.locationId;
  const hasEmbeddedLocation = Boolean(winery?.location);

  // 1. Fallback de etiquetas si no están cargadas en el catálogo del contexto
  useEffect(() => {
    if (catalog) return;
    let isMounted = true;
    if (!wineryId) return;

    Promise.resolve().then(async () => {
      try {
        const list = await getWines({ wineryId, pageSize: 100 });
        if (isMounted) setWinesFallback(list);
      } catch {
        if (isMounted) setWinesFallback([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [catalog, wineryId]);

  // 2. Resolver Terruño Geográfico de respaldo si no viene embebido
  useEffect(() => {
    if (hasEmbeddedLocation || !locationId) return;
    let isMounted = true;

    Promise.resolve().then(async () => {
      try {
        const loc = await getLocationById(locationId);
        if (isMounted) {
          setAsyncLocationLabel(`${loc.cityName}, ${loc.stateName}`);
        }
      } catch {
        // Ignorar fallo de geolocalización
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hasEmbeddedLocation, locationId]);

  // 3. Consulta unificada al endpoint público (seguidores, valoración y totales)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (!wineryId) {
      return;
    }

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoadingMetrics(true);

      try {
        const profile = await getWineryPublicProfile(wineryId, controller.signal);
        if (!isMounted) return;
        setPublicData({
          followersCount: profile.followersCount ?? 0,
          averageRating: profile.averageRating ?? null,
          totalReviews: profile.reviewCount ?? 0,
          vintagesCount: profile.totals?.vintages ?? 0,
        });
      } catch {
        if (!isMounted) return;
        // Un error en este dato no debe romper el resto de la pantalla
        setPublicData({
          followersCount: null,
          averageRating: null,
          totalReviews: 0,
          vintagesCount: 0,
        });
      } finally {
        if (isMounted) {
          setIsLoadingMetrics(false);
        }
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wineryId]);

  // Coordenadas para el mapa Leaflet de solo lectura
  const hasCoordinates = Boolean(winery?.latitude != null && winery?.longitude != null);
  const lat = winery?.latitude ?? -33.0;
  const lon = winery?.longitude ?? -68.8;

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-neutral-100 font-sans flex flex-col justify-between selection:bg-[#6e1a24] selection:text-white">
      {/* 1. TopBar Contextual Fija */}
      <WineryTopBar
        backTo="/bodega/dashboard"
        backLabel="Volver al panel"
        rightAction={
          winery?.id ? (
            <Link
              to={`/bodegas/${winery.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#17151a] hover:bg-[#221f26] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver vidriera pública</span>
            </Link>
          ) : undefined
        }
      />

      {/* 2. Contenedor Principal con offset para TopBar fija (h-14) */}
      <div className="flex-1 flex flex-col pt-14">
        {/* BANNER DE BODEGA UNIFICADO */}
        <WineryBanner
          wineryName={winery?.name}
          bannerUrl={winery?.bannerUrl}
        />

        {/* CABECERA INSTITUCIONAL CON LOGO CIRCULAR SUPERPUESTO */}
        <header className="w-full bg-[#0b0b0e] border-b border-white/10 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative z-10 -mt-14 sm:-mt-16 md:-mt-20 flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Bloque Izquierdo: Logo Circular superpuesto + Nombre Serif + Terruño */}
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                {/* Logo Circular con aro aislante */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-[#0b0b0e] shadow-2xl border border-white/15 bg-[#17151a] shrink-0 flex items-center justify-center">
                  <WineryLogo
                    src={winery?.logoUrl}
                    name={winery?.name}
                    size="lg"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Identidad y Metadatos */}
                <div className="max-w-2xl pt-2 sm:pt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
                      {winery?.name || 'Mi Bodega'}
                    </h1>

                    {/* Badge de Estado */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Bodega Oficial</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span>En revisión editorial</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-800/40">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Observaciones pendientes</span>
                      </span>
                    )}
                  </div>

                  {/* Metadatos Geográficos y de Fundación */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-sans mt-2.5">
                    {locationLabel && (
                      <span className="flex items-center gap-1.5 text-zinc-200">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{locationLabel}</span>
                      </span>
                    )}

                    {winery?.foundationYear && (
                      <span className="flex items-center gap-1.5 font-mono text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                        <span>Fundada en {winery.foundationYear}</span>
                      </span>
                    )}

                    {winery?.website && (
                      <a
                        href={
                          /^https?:\/\//i.test(winery.website)
                            ? winery.website
                            : `https://${winery.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-rose-300 hover:text-rose-200 underline transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Sitio web oficial</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                  </div>

                  {/* Semblanza Histórica y Filosofía */}
                  <div className="mt-3.5 max-w-xl">
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                      {winery?.description && winery.description.trim().length > 0 ? (
                        winery.description
                      ) : (
                        <span className="italic text-zinc-500 text-xs sm:text-sm">
                          Sin semblanza histórica redactada aún. Completá la trayectoria familiar de tu establecimiento en la configuración.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloque Derecho: Acciones y Cinta de Métricas */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-end gap-3.5 pt-2">
                {/* Botones de Acción */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to="/bodega/configuracion"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#17151a] hover:bg-[#221f26] border border-white/15 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Editar configuración</span>
                  </Link>

                  {winery?.id && (
                    <Link
                      to={`/bodegas/${winery.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#6e1a24] hover:bg-[#85222e] text-white border border-rose-700/50 text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver cómo lo ven los usuarios</span>
                    </Link>
                  )}
                </div>

                {/* Métricas Consolidadas en Card Sobria */}
                <div className="bg-[#17151a]/90 border border-white/10 rounded-md px-5 py-2.5 flex items-center gap-5 sm:gap-6 shadow-sm">
                  <div className="text-center sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                      {winesCount}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 font-sans uppercase tracking-wider mt-1">
                      Etiquetas
                    </div>
                  </div>

                  <div className="h-7 w-px bg-white/10" />

                  <div className="text-center sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                      {vintagesCount}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 font-sans uppercase tracking-wider mt-1">
                      Cosechas
                    </div>
                  </div>

                  <div className="h-7 w-px bg-white/10" />

                  <div className="text-center sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                      {isApproved ? followersCount ?? 0 : '—'}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 font-sans uppercase tracking-wider mt-1">
                      Seguidores
                    </div>
                  </div>

                  <div className="h-7 w-px bg-white/10" />

                  <div className="text-center sm:text-right">
                    {averageRating && averageRating > 0 ? (
                      <>
                        <div className="text-xl sm:text-2xl font-bold text-amber-200 font-mono leading-none flex items-center gap-1 justify-center sm:justify-end">
                          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>{averageRating.toFixed(1)}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-400 font-sans uppercase tracking-wider mt-1">
                          Puntaje ({totalReviews})
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs sm:text-sm font-medium text-zinc-300 font-sans leading-none">
                          {totalReviews > 0
                            ? `${totalReviews} ${totalReviews === 1 ? 'reseña' : 'reseñas'} · Aún sin valoración`
                            : 'Aún sin valoración'}
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-400 font-sans uppercase tracking-wider mt-1">
                          Puntaje
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
          {/* Banner de Estado (Pending / Rejected) */}
          {winery && <WineryStatusBanner status={winery.status} wineryName={winery.name} />}

          {/* Grilla de Terruño y Accesos Rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 1. Columna Izquierda: Terruño y Mapa de Solo Lectura */}
            <div className="lg:col-span-1 rounded-2xl bg-[#121015] border border-white/10 p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                  Terruño y Geolocalización
                </span>
                <Compass className="w-4 h-4 text-rose-400" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-white">
                  {locationLabel || 'Región vitivinícola argentina'}
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {hasCoordinates
                    ? `Coordenadas verificadas: Lat ${lat.toFixed(4)}, Long ${lon.toFixed(4)}`
                    : 'Ubicación identificada mediante el nomenclador territorial oficial.'}
                </p>
              </div>

              {/* Mapa Leaflet de Solo Lectura */}
              {hasCoordinates ? (
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner">
                  <MapContainer
                    center={[lat, lon]}
                    zoom={12}
                    scrollWheelZoom={false}
                    dragging={false}
                    touchZoom={false}
                    doubleClickZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                    className="w-full h-44 rounded-xl z-0"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lon]} />
                  </MapContainer>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-900/40 border border-white/5 text-center py-8 space-y-2">
                  <MapPin className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400 font-sans">
                    Finca sin coordenadas satelitales asignadas.
                  </p>
                  <Link
                    to="/bodega/configuracion"
                    className="inline-block text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 underline pt-1"
                  >
                    Asignar en configuración →
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Columna Central y Derecha: Catálogo Resumido y Acceso Directo */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de Catálogo */}
              <div className="rounded-2xl bg-[#121015] border border-white/10 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block mb-0.5">
                      Catálogo Oficial
                    </span>
                    <h2 className="font-serif text-xl font-semibold text-white">
                      Etiquetas publicadas por tu establecimiento
                    </h2>
                  </div>

                  <Link
                    to="/bodega/vinos"
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 transition-colors font-semibold"
                  >
                    <span>Ir al catálogo completo ({wines.length})</span>
                    <span>→</span>
                  </Link>
                </div>

                {isLoadingMetrics ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-24 rounded-xl bg-white/5 border border-white/5 animate-pulse"
                      />
                    ))}
                  </div>
                ) : wines.length === 0 ? (
                  <div className="text-center py-8 space-y-2 bg-stone-900/30 rounded-xl border border-white/5">
                    <Wine className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-xs text-neutral-400">
                      Todavía no diste de alta ninguna etiqueta oficial.
                    </p>
                    <Link
                      to="/bodega/vinos"
                      className="inline-block text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 underline"
                    >
                      Cargar primera etiqueta ahora
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {wines.slice(0, 4).map((wine) => (
                      <div
                        key={wine.id}
                        className="p-4 rounded-xl bg-[#17151a] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-serif font-semibold text-white truncate">
                            {wine.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
                            {typeof wine.wineType === 'string' ? wine.wineType : 'Vino'} · {wine.reviewCount} {wine.reviewCount === 1 ? 'reseña' : 'reseñas'}
                          </p>
                        </div>

                        {wine.averageRating ? (
                          <div className="flex items-center gap-1 text-xs text-amber-200 font-mono shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                            <span>{wine.averageRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-sans shrink-0">
                            {wine.reviewCount > 0
                              ? `${wine.reviewCount} ${wine.reviewCount === 1 ? 'reseña' : 'reseñas'} · Aún sin valoración`
                              : 'Sin reseñas'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guía Rápida de Acciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/bodega/vinos"
                  className="p-4 rounded-xl bg-[#121015] border border-white/10 hover:border-white/20 transition-all flex items-center gap-3.5 group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Wine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white font-sans group-hover:text-rose-200 transition-colors">
                      Gestionar Catálogo y Cosechas
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Publicar añadas, cortes varietales y fichas técnicas.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/bodega/reclamar"
                  className="p-4 rounded-xl bg-[#121015] border border-white/10 hover:border-white/20 transition-all flex items-center gap-3.5 group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white font-sans group-hover:text-amber-200 transition-colors">
                      Reclamar Botellas Comunitarias
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Oficializar vinos cargados por aficionados conservando catas.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Editorial de Bodega Persistente */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}
