import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Plus,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import {
  useWinery,
  useWineryCatalog,
  getWineryPublicProfile,
  getLocationById,
  WineryKpiRibbon,
  WineryQuickActions,
  WineryChecklistCard,
  WineryRecentWines,
  WineryLogo,
  WineCreateModal,
  toPublicCatalogWines,
  type WineryPublicCatalogWineDto,
} from '../features/winery';

/**
 * WineryDashboardPage Component (/bodega/dashboard)
 * Pantalla de inicio del panel oficial de bodega en AyVino.
 * Integra saludo editorial de bienvenida, cinta de 4 KPIs, accesos rápidos,
 * checklist interactivo de perfil institucional, modal de nueva etiqueta
 * y catálogo visual de etiquetas registradas a ancho completo.
 */
export default function WineryDashboardPage() {
  const { user } = useAuth();
  const { winery } = useWinery();
  const { catalog, isLoading: isCatalogLoading, reload: reloadCatalog } = useWineryCatalog();

  const [asyncLocationName, setAsyncLocationName] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Derivar etiquetas públicas a partir del catálogo del dueño usando el adaptador
  const publicWines: WineryPublicCatalogWineDto[] = useMemo(() => {
    if (!catalog?.wines) return [];
    return toPublicCatalogWines(catalog.wines);
  }, [catalog?.wines]);

  const winesCount = catalog?.totals.labels ?? publicWines.length;

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

  const wineryId = winery?.id;

  // 1. Resolver Terruño Geográfico de respaldo si no viene embebido
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

  // Función para recargar datos públicos (KPIs)
  const fetchPublicData = useCallback(async (signal?: AbortSignal) => {
    if (!wineryId) return;
    setIsLoadingPublic(true);
    try {
      const profile = await getWineryPublicProfile(wineryId, signal);
      setPublicData({
        followersCount: profile.followersCount ?? 0,
        averageRating: profile.averageRating ?? null,
        totalReviews: profile.reviewCount ?? 0,
      });
    } catch {
      setPublicData({
        followersCount: null,
        averageRating: null,
        totalReviews: 0,
      });
    } finally {
      setIsLoadingPublic(false);
    }
  }, [wineryId]);

  // 2. Consulta unificada al endpoint público (seguidores, valoración y totales)
  useEffect(() => {
    const controller = new AbortController();
    void fetchPublicData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchPublicData]);

  // Al crear una nueva etiqueta exitosamente: cerrar modal y recargar catálogo y KPIs
  const handleWineCreated = async () => {
    setIsCreateModalOpen(false);
    await reloadCatalog();
    await fetchPublicData();
  };

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

                {/* Badge de Estado: solo "En Verificación" y "Observaciones Pendientes" */}
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

        {/* Acciones de Cabecera: solo botón "+ Nueva etiqueta" que abre el modal in situ */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva etiqueta</span>
          </button>
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
        isLoading={isLoadingPublic || isCatalogLoading}
      />

      {/* 3. Accesos Rápidos Operativos (3 columnas) */}
      <WineryQuickActions wineryId={winery?.id} isApproved={isApproved} />

      {/* 4. Checklist Institucional */}
      {winery && (
        <WineryChecklistCard winery={winery} winesCount={winesCount} />
      )}

      {/* 5. Etiquetas Registradas (ancho completo con cards de catálogo público) */}
      <WineryRecentWines
        wines={publicWines}
        isLoading={isCatalogLoading}
        totalCount={winesCount}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 6. Modal de Alta de Etiqueta Oficial */}
      {winery?.id && (
        <WineCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          wineryId={winery.id}
          locationId={winery.locationId}
          onWineCreated={handleWineCreated}
        />
      )}
    </div>
  );
}
