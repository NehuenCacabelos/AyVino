import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import {
  useWinery,
  useWineryCatalog,
  getWines,
  getWineryPublicProfile,
  getLocationById,
  WineryKpiRibbon,
  WineryQuickActions,
  WineryChecklistCard,
  WineryRecentWines,
  WineryLogo,
  type WineResponseDto,
} from '../features/winery';

/**
 * WineryDashboardPage Component (/bodega/dashboard)
 * Pantalla de inicio del panel oficial de bodega en AyVino.
 * Integra saludo editorial de bienvenida, cinta de 4 KPIs, accesos rápidos,
 * checklist interactivo de perfil institucional y resumen de etiquetas oficiales.
 */
export default function WineryDashboardPage() {
  const { user } = useAuth();
  const { winery } = useWinery();
  const { catalog, isLoading: isCatalogLoading } = useWineryCatalog();

  const [asyncLocationName, setAsyncLocationName] = useState<string | null>(null);
  const [winesFallback, setWinesFallback] = useState<WineResponseDto[]>([]);
  const [isLoadingWines, setIsLoadingWines] = useState<boolean>(false);
  const [publicData, setPublicData] = useState<{
    followersCount: number | null;
    averageRating: number | null;
    totalReviews: number;
  }>({
    followersCount: null,
    averageRating: null,
    totalReviews: 0,
  });
  const [isLoadingPublic, setIsLoadingPublic] = useState<boolean>(() => Boolean(winery?.id));

  // Fecha editorial formateada en español rioplatense
  const formattedDate = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Terruño derivado directamente de la entidad o del lookup asíncrono
  const locationName = winery?.location
    ? `${winery.location.regionName}, ${winery.location.stateName}`
    : asyncLocationName;

  // Derivar etiquetas a partir del contexto de catálogo (o fallback)
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

  // Derivar métricas de añadas a partir de los totales del catálogo
  const vintagesStats = catalog?.totals
    ? {
        total: catalog.totals.vintages,
        approved: catalog.totals.vintagesApproved,
        pending: catalog.totals.vintagesPending,
      }
    : {
        total: 0,
        approved: 0,
        pending: 0,
      };

  // 1. Carga de fallback para etiquetas si no están disponibles en el contexto
  const wineryId = winery?.id;
  useEffect(() => {
    if (catalog) return;
    let isMounted = true;
    if (!wineryId) return;

    Promise.resolve().then(async () => {
      setIsLoadingWines(true);
      try {
        const list = await getWines({ wineryId, pageSize: 100 });
        if (isMounted) setWinesFallback(list);
      } catch {
        if (isMounted) setWinesFallback([]);
      } finally {
        if (isMounted) setIsLoadingWines(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [catalog, wineryId]);

  // 2. Resolver Terruño Geográfico de respaldo si no viene embebido
  const locationId = winery?.locationId;
  const hasEmbeddedLocation = Boolean(winery?.location);
  useEffect(() => {
    if (hasEmbeddedLocation || !locationId) return;
    let isMounted = true;

    Promise.resolve().then(async () => {
      try {
        const loc = await getLocationById(locationId);
        if (isMounted) {
          setAsyncLocationName(`${loc.cityName}, ${loc.stateName}`);
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
      setIsLoadingPublic(true);

      try {
        const profile = await getWineryPublicProfile(wineryId, controller.signal);
        if (!isMounted) return;
        setPublicData({
          followersCount: profile.followersCount ?? 0,
          averageRating: profile.averageRating ?? null,
          totalReviews: profile.reviewCount ?? 0,
        });
      } catch {
        if (!isMounted) return;
        // Un error en este dato no debe romper el resto de la pantalla
        setPublicData({
          followersCount: null,
          averageRating: null,
          totalReviews: 0,
        });
      } finally {
        if (isMounted) {
          setIsLoadingPublic(false);
        }
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wineryId]);

  const isApproved = winery?.status === 'Approved';
  const isPending = winery?.status === 'Pending';
  const isRejected = winery?.status === 'Rejected';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Encabezado Editorial y Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
              {capitalizedDate}
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-200/70 font-semibold">
              Panel Oficial de Cava
            </span>
          </div>

          <div className="flex items-center gap-4">
            <WineryLogo
              src={winery?.logoUrl}
              logoImageId={winery?.logoImageId}
              name={winery?.name}
              size="lg"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0"
            />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-100 tracking-tight">
                  {winery?.name || 'Mi Bodega'}
                </h1>

                {/* Badge de Estado */}
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Bodega Oficial</span>
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>En Verificación</span>
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-800/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Observaciones Pendientes</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subtítulo: Terruño y Metadatos */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-sans pt-1">
            {locationName && (
              <span className="flex items-center gap-1.5 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{locationName}</span>
              </span>
            )}
            {winery?.foundationYear && (
              <span className="flex items-center gap-1.5 text-neutral-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                <span>Fundada en {winery.foundationYear}</span>
              </span>
            )}
            <span className="text-neutral-500">
              Administrado por <strong className="text-neutral-300 font-normal">{user?.username}</strong>
            </span>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-3 shrink-0">
          {isApproved && winery?.id && (
            <Link
              to={`/bodegas/${winery.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 hover:text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ver vidriera</span>
            </Link>
          )}

          <Link
            to="/bodega/vinos"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva etiqueta</span>
          </Link>
        </div>
      </div>

      {/* 2. Cinta de 4 KPIs */}
      <WineryKpiRibbon
        winesCount={winesCount}
        vintagesCount={vintagesStats.total}
        approvedVintagesCount={vintagesStats.approved}
        pendingVintagesCount={vintagesStats.pending}
        followersCount={isApproved ? publicData.followersCount : null}
        averageRating={publicData.averageRating}
        totalReviews={publicData.totalReviews}
        isWineryApproved={isApproved}
        isLoading={isLoadingPublic || isCatalogLoading || isLoadingWines}
      />

      {/* 3. Accesos Rápidos Operativos */}
      <WineryQuickActions wineryId={winery?.id} isApproved={isApproved} />

      {/* 4. Bloques Complementarios: Checklist de Perfil y Últimas Etiquetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Checklist Institucional */}
        {winery && (
          <WineryChecklistCard winery={winery} winesCount={winesCount} />
        )}

        {/* Resumen de Últimos Vinos */}
        <WineryRecentWines wines={wines} isLoading={isLoadingWines || isCatalogLoading} />
      </div>
    </div>
  );
}
