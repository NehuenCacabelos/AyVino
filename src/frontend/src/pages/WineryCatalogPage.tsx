import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  ExternalLink,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  useWinery,
  useWineryCatalog,
  WineCreateModal,
  WineVintagesModal,
  WineryCatalogRibbon,
  WineryCatalogToolbar,
  WineryCatalogCard,
  WineryCatalogEmptyState,
  filterAndSortCatalogWines,
  type CatalogSortOption,
  type WineryCatalogWineDto,
  type WineResponseDto,
  type WineType,
} from '../features/winery';

const PAGE_SIZE = 12;

export default function WineryCatalogPage() {
  const { winery } = useWinery();
  const { catalog, isLoading, error, reload } = useWineryCatalog();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de Filtros y Orden
  const [searchQuery, setSearchQuery] = useState('');
  const [wineType, setWineType] = useState('All');
  const [grape, setGrape] = useState('All');
  const [year, setYear] = useState('All');
  const [vintageStatus, setVintageStatus] = useState('All');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    () => searchParams.get('action') === 'new' || searchParams.get('nuevo') === '1'
  );
  const [selectedWineForVintages, setSelectedWineForVintages] = useState<WineResponseDto | null>(
    null
  );

  // Limpiar parámetros transaccionales (?action=new o ?nuevo=1) tras lectura inicial
  const actionParam = searchParams.get('action');
  const nuevoParam = searchParams.get('nuevo');
  useEffect(() => {
    if (actionParam === 'new' || nuevoParam === '1') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('action');
          next.delete('nuevo');
          return next;
        },
        { replace: true }
      );
    }
  }, [actionParam, nuevoParam, setSearchParams]);

  // Extraer valores estables del catálogo para memoización
  const wines = catalog?.wines;
  const wineryStatus = catalog?.wineryStatus;

  // Lista de uvas únicas derivadas del catálogo
  const availableGrapes = useMemo(() => {
    if (!wines) return [];
    const grapesSet = new Set<string>();
    for (const w of wines) {
      for (const v of w.vintages) {
        for (const g of v.grapes) {
          if (g.grapeName) grapesSet.add(g.grapeName);
        }
      }
    }
    return Array.from(grapesSet).sort((a, b) => a.localeCompare(b, 'es'));
  }, [wines]);

  // Lista de años únicos derivados del catálogo
  const availableYears = useMemo(() => {
    if (!wines) return [];
    const yearsSet = new Set<number>();
    for (const w of wines) {
      for (const v of w.vintages) {
        if (typeof v.year === 'number' && !isNaN(v.year)) {
          yearsSet.add(v.year);
        }
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [wines]);

  // Indicador de filtros activos
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    wineType !== 'All' ||
    grape !== 'All' ||
    year !== 'All' ||
    vintageStatus !== 'All' ||
    sortBy !== 'name_asc';

  // Handler para restablecer filtros
  const handleResetFilters = () => {
    setSearchQuery('');
    setWineType('All');
    setGrape('All');
    setYear('All');
    setVintageStatus('All');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  // Filtrado y ordenamiento reactivo (Inmutable)
  const filteredWines = useMemo(() => {
    if (!wines) return [];
    return filterAndSortCatalogWines(wines, {
      searchQuery,
      wineType,
      grape,
      year,
      vintageStatus,
      sortBy,
      wineryStatus,
    });
  }, [wines, wineryStatus, searchQuery, wineType, grape, year, vintageStatus, sortBy]);

  // Paginación derivada (Inmutable)
  const totalPages = Math.max(1, Math.ceil(filteredWines.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedWines = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredWines.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredWines, safeCurrentPage]);

  // Convertir WineryCatalogWineDto a WineResponseDto para el modal de añadas
  const handleOpenVintagesModal = (wine: WineryCatalogWineDto) => {
    if (!winery) return;
    const mappedWine: WineResponseDto = {
      id: wine.id,
      wineryId: winery.id,
      wineryNameText: winery.name,
      name: wine.name,
      description: wine.description ?? null,
      wineType: wine.wineType as WineType,
      locationId: winery.locationId ?? null,
      sourceType: wine.sourceType,
      duplicateOfWineId: null,
      averageRating: wine.averageRating ?? null,
      reviewCount: wine.reviewCount,
    };
    setSelectedWineForVintages(mappedWine);
  };

  const isWineryPending = catalog?.wineryStatus === 'Pending' || winery?.status === 'Pending';
  const isWineryRejected = catalog?.wineryStatus === 'Rejected' || winery?.status === 'Rejected';

  if (isLoading && !catalog) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-[#121015] rounded-2xl border border-white/5" />
        <div className="h-32 bg-[#121015] rounded-2xl border border-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 bg-[#121015] rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !catalog) {
    return (
      <div className="p-8 text-center rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="font-serif text-lg text-zinc-100">Error al cargar el catálogo</h3>
        <p className="text-xs text-rose-300/80">{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Encabezado Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Portfolio Oficial de Cosechas
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-neutral-100 tracking-tight">
            Mi catálogo
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
            Administrá tus botellas oficiales, cortes varietales y añadas habilitadas para la comunidad.
          </p>
        </div>

        {/* Acciones principales del Encabezado */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {winery?.id && (
            <Link
              to={`/bodegas/${winery.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white border border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Ver cómo lo ven los usuarios"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ver cómo lo ven los usuarios</span>
            </Link>
          )}

          {!isWineryRejected && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva etiqueta</span>
            </button>
          )}
        </div>
      </div>

      {/* Cartel Informativo: Bodega en Revisión */}
      {isWineryPending && (
        <div
          role="status"
          className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs font-sans shadow-lg animate-in fade-in"
        >
          <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-100">Tu bodega está en revisión</p>
            <p className="text-amber-200/80 leading-relaxed">
              Podés cargar tus vinos: permanecerán como borradores privados y serán visibles para los usuarios una vez que el equipo de moderación apruebe tu bodega.
            </p>
          </div>
        </div>
      )}

      {/* Cartel Informativo: Aviso de Límite HasMore */}
      {catalog?.hasMore && (
        <div
          role="status"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-sans shadow-sm"
        >
          <Info className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Mostrando las primeras 200 etiquetas de tu bodega.</span>
        </div>
      )}

      {/* Cinta de Totales */}
      {catalog?.totals && (
        <WineryCatalogRibbon
          totals={catalog.totals}
          isWineryPending={isWineryPending}
        />
      )}

      {/* Barra de Herramientas y Filtros */}
      <WineryCatalogToolbar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        wineType={wineType}
        onWineTypeChange={(val) => {
          setWineType(val);
          setCurrentPage(1);
        }}
        grape={grape}
        onGrapeChange={(val) => {
          setGrape(val);
          setCurrentPage(1);
        }}
        year={year}
        onYearChange={(val) => {
          setYear(val);
          setCurrentPage(1);
        }}
        vintageStatus={vintageStatus}
        onVintageStatusChange={(val) => {
          setVintageStatus(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        availableGrapes={availableGrapes}
        availableYears={availableYears}
        isWineryPending={isWineryPending}
      />

      {/* Contenido: Grilla/Lista de Vinos o Estado Vacío */}
      {filteredWines.length === 0 ? (
        <WineryCatalogEmptyState
          isFiltered={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onCreateWine={() => setIsCreateModalOpen(true)}
          canCreateWine={!isWineryRejected}
        />
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedWines.map((wine) => (
                <WineryCatalogCard
                  key={wine.id}
                  wine={wine}
                  wineryStatus={catalog?.wineryStatus}
                  viewMode="grid"
                  onAddVintage={handleOpenVintagesModal}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedWines.map((wine) => (
                <WineryCatalogCard
                  key={wine.id}
                  wine={wine}
                  wineryStatus={catalog?.wineryStatus}
                  viewMode="list"
                  onAddVintage={handleOpenVintagesModal}
                />
              ))}
            </div>
          )}

          {/* Barra de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-neutral-400">
              <span className="font-mono">
                Página {safeCurrentPage} de {totalPages} ({filteredWines.length} etiquetas)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none border border-white/10 text-neutral-200 transition-colors cursor-pointer"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none border border-white/10 text-neutral-200 transition-colors cursor-pointer"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Creación de Etiqueta */}
      {winery?.id && (
        <WineCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          wineryId={winery.id}
          locationId={winery.locationId}
          onWineCreated={() => {
            void reload();
          }}
        />
      )}

      {/* Modal de Añadas de la Etiqueta */}
      <WineVintagesModal
        isOpen={Boolean(selectedWineForVintages)}
        onClose={() => setSelectedWineForVintages(null)}
        wine={selectedWineForVintages}
        onVintageAdded={() => {
          void reload();
        }}
      />
    </div>
  );
}
