import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Wine, AlertTriangle, Clock, RefreshCw, X, Plus } from 'lucide-react';
import { useAuth } from '../features/auth';
import { DashboardNavbar, UncorkDialog, type UncorkTargetWine } from '../features/dashboard';
import {
  VaultHeader,
  VaultVitals,
  VaultTabs,
  VaultWineCard,
  VaultLogbookModule,
  TechnicalSheetModal,
  QuickAddBottleModal,
  getCellarsApi,
  getCellarItemsApi,
  createCellarApi,
  renameCellarApi,
  deleteCellarApi,
  mapCellarItemToCellarWine,
  extractCellarErrorMessage,
  type CellarWine,
  type WineSortOption,
  type VaultTab,
  type TastingLogEntry,
} from '../features/cava';
import { getMyHistoryApi } from '../features/users/api/userApi';
import type { CellarDto, HistoryItemDto } from '../features/users/types';

function formatHistoryDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function mapHistoryItemToTastingLog(item: HistoryItemDto): TastingLogEntry {
  return {
    id: item.id,
    wineId: item.wine?.id,
    wineName: item.wine?.name ?? 'Vino',
    wineryName: item.wine?.wineryName,
    vintageYear: item.vintage?.year,
    uncorkDate: formatHistoryDate(item.occurredAt),
    notes: item.comment,
    ratingValue: item.rating,
    personalImageId: item.personalImageId,
    vintageImageId: item.vintage?.imageId,
  };
}

/**
 * CavaPage Component (/cava)
 * Conexión completa y multi-cava real:
 * - Soporte para hasta 3 cavas con persistencia en URL (?cava=<id>).
 * - Carga real sin datos inventados ni persistencia local de botellas.
 * - Gestión completa de cavas: creación, renombrado y eliminación con manejo de 409.
 * - Ficha técnica de botellas con edición de cantidad/fecha/notas y eliminación.
 */
export default function CavaPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Estado de Cavas
  const [cellars, setCellars] = useState<CellarDto[]>([]);
  const [cellarsLoading, setCellarsLoading] = useState(true);
  const [cellarsError, setCellarsError] = useState<string | null>(null);

  // 2. Cava Activa
  const cavaParam = searchParams.get('cava');
  const selectedCellarId = useMemo(() => {
    if (cellars.length === 0) return null;
    if (cavaParam) {
      const match = cellars.find((c) => c.id === Number(cavaParam));
      if (match) return match.id;
    }
    return cellars[0].id;
  }, [cellars, cavaParam]);

  // Sincronizar parámetro en URL si falta o difiere
  useEffect(() => {
    if (selectedCellarId && cavaParam !== String(selectedCellarId)) {
      setSearchParams({ cava: String(selectedCellarId) }, { replace: true });
    }
  }, [selectedCellarId, cavaParam, setSearchParams]);

  // 3. Ítems de la Cava Activa
  const [items, setItems] = useState<CellarWine[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // 4. Pestaña y Ordenamiento
  const [activeTab, setActiveTab] = useState<VaultTab>('all');
  const [sortOption, setSortOption] = useState<WineSortOption>('default');

  // 5. Notificación flotante
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 6. Modales de Gestión de Cavas
  const [isCreateCellarOpen, setIsCreateCellarOpen] = useState(false);
  const [createCellarName, setCreateCellarName] = useState('');
  const [createCellarError, setCreateCellarError] = useState<string | null>(null);
  const [isCreatingCellar, setIsCreatingCellar] = useState(false);

  const [isRenameCellarOpen, setIsRenameCellarOpen] = useState(false);
  const [renameCellarName, setRenameCellarName] = useState('');
  const [renameCellarError, setRenameCellarError] = useState<string | null>(null);
  const [isRenamingCellar, setIsRenamingCellar] = useState(false);

  const [isDeleteCellarOpen, setIsDeleteCellarOpen] = useState(false);
  const [deleteCellarError, setDeleteCellarError] = useState<string | null>(null);
  const [isDeletingCellar, setIsDeletingCellar] = useState(false);

  // 7. Modales de Botellas
  const [selectedDetailsWine, setSelectedDetailsWine] = useState<CellarWine | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<UncorkTargetWine | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Bitácora de catas (alimentada por historial real de descorches)
  const [logbookEntries, setLogbookEntries] = useState<TastingLogEntry[]>([]);
  const [logbookPage, setLogbookPage] = useState(1);
  const [hasMoreLogbook, setHasMoreLogbook] = useState(false);
  const [logbookLoadingMore, setLogbookLoadingMore] = useState(false);
  const [reloadLogbookKey, setReloadLogbookKey] = useState(0);

  const loadLogbook = useCallback(() => {
    setLogbookPage(1);
    setReloadLogbookKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getMyHistoryApi({ pageNumber: 1, pageSize: 20, type: 'Uncorked' })
      .then((items) => {
        if (!isMounted) return;
        setLogbookEntries(items.map(mapHistoryItemToTastingLog));
        setHasMoreLogbook(items.length === 20);
      })
      .catch(() => {
        if (!isMounted) return;
        setLogbookEntries([]);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadLogbookKey]);

  const handleLoadMoreLogbook = async () => {
    if (logbookLoadingMore || !hasMoreLogbook) return;
    setLogbookLoadingMore(true);
    const nextPage = logbookPage + 1;
    try {
      const more = await getMyHistoryApi({
        pageNumber: nextPage,
        pageSize: 20,
        type: 'Uncorked',
      });
      setLogbookEntries((prev) => [...prev, ...more.map(mapHistoryItemToTastingLog)]);
      setLogbookPage(nextPage);
      setHasMoreLogbook(more.length === 20);
    } catch {
      // Ignorar error al cargar más
    } finally {
      setLogbookLoadingMore(false);
    }
  };

  const handleOpenUncork = (wine: CellarWine) => {
    if (!wine.wineId || !wine.wineVintageId) return;
    setUncorkingWine({
      wineId: wine.wineId,
      wineVintageId: wine.wineVintageId,
      name: wine.name,
      winery: wine.winery,
      year: wine.vintage,
      imageUrl: wine.imageUrl,
      wineType: wine.varietal,
      bottle: wine.bottle,
      cellarId: wine.cellarId ?? selectedCellarId ?? undefined,
      availableUnits: wine.units,
    });
  };

  const handleUncorkDone = () => {
    const wineName = uncorkingWine?.name ?? 'Vino';
    setUncorkingWine(null);
    showNotification(`Descorche registrado: «${wineName}»`);
    loadCellars();
    loadCellarItems();
    loadLogbook();
  };

  const showNotification = (msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const [reloadCellarsKey, setReloadCellarsKey] = useState(0);
  const [reloadItemsKey, setReloadItemsKey] = useState(0);

  // Cargar lista de cavas del usuario
  useEffect(() => {
    let isMounted = true;
    getCellarsApi()
      .then((data) => {
        if (!isMounted) return;
        setCellars(data);
        setCellarsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setCellarsError(extractCellarErrorMessage(err, 'No se pudieron cargar tus cavas.'));
        setCellarsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadCellarsKey]);

  // Cargar ítems de la cava seleccionada
  useEffect(() => {
    if (!selectedCellarId) {
      return;
    }

    let isMounted = true;
    getCellarItemsApi(selectedCellarId)
      .then((rawItems) => {
        if (!isMounted) return;
        const mapped = rawItems.map((item) => mapCellarItemToCellarWine(item, selectedCellarId));
        setItems(mapped);
        setItemsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setItemsError(extractCellarErrorMessage(err, 'No se pudieron cargar las botellas de esta cava.'));
        setItemsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCellarId, reloadItemsKey]);

  // Recargas manuales
  const loadCellars = useCallback(() => {
    setCellarsLoading(true);
    setCellarsError(null);
    setReloadCellarsKey((k) => k + 1);
  }, []);

  const loadCellarItems = useCallback(() => {
    setItemsLoading(true);
    setItemsError(null);
    setReloadItemsKey((k) => k + 1);
  }, []);

  // Recarga combinada tras cambios en botellas
  const handleBottleMutated = () => {
    loadCellarItems();
    loadCellars();
  };

  // Creación de Cava
  const handleCreateCellarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = createCellarName.trim();
    if (!trimmed) {
      setCreateCellarError('El nombre de la cava es obligatorio.');
      return;
    }
    if (trimmed.length > 100) {
      setCreateCellarError('El nombre no puede superar los 100 caracteres.');
      return;
    }

    setIsCreatingCellar(true);
    setCreateCellarError(null);

    try {
      const created = await createCellarApi({ name: trimmed });
      setIsCreateCellarOpen(false);
      setCreateCellarName('');
      await loadCellars();
      setSearchParams({ cava: String(created.id) }, { replace: true });
      showNotification(`¡Cava «${created.name}» creada exitosamente!`);
    } catch (err: unknown) {
      setCreateCellarError(extractCellarErrorMessage(err, 'No se pudo crear la cava.'));
    } finally {
      setIsCreatingCellar(false);
    }
  };

  // Renombrado de Cava
  const handleOpenRename = () => {
    const current = cellars.find((c) => c.id === selectedCellarId);
    if (!current) return;
    setRenameCellarName(current.name);
    setRenameCellarError(null);
    setIsRenameCellarOpen(true);
  };

  const handleRenameCellarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCellarId) return;
    const trimmed = renameCellarName.trim();
    if (!trimmed) {
      setRenameCellarError('El nombre de la cava es obligatorio.');
      return;
    }
    if (trimmed.length > 100) {
      setRenameCellarError('El nombre no puede superar los 100 caracteres.');
      return;
    }

    setIsRenamingCellar(true);
    setRenameCellarError(null);

    try {
      const updated = await renameCellarApi(selectedCellarId, { name: trimmed });
      setIsRenameCellarOpen(false);
      await loadCellars();
      showNotification(`Cava renombrada a «${updated.name}».`);
    } catch (err: unknown) {
      setRenameCellarError(extractCellarErrorMessage(err, 'No se pudo renombrar la cava.'));
    } finally {
      setIsRenamingCellar(false);
    }
  };

  // Eliminación de Cava
  const handleDeleteCellarSubmit = async () => {
    if (!selectedCellarId) return;
    setIsDeletingCellar(true);
    setDeleteCellarError(null);

    try {
      await deleteCellarApi(selectedCellarId);
      setIsDeleteCellarOpen(false);
      const remaining = cellars.filter((c) => c.id !== selectedCellarId);
      await loadCellars();
      if (remaining.length > 0) {
        setSearchParams({ cava: String(remaining[0].id) }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      showNotification('Cava eliminada exitosamente.');
    } catch (err: unknown) {
      setDeleteCellarError(extractCellarErrorMessage(err, 'No se pudo eliminar la cava.'));
    } finally {
      setIsDeletingCellar(false);
    }
  };

  // Indicadores Vitales Derivados de la Cava Activa
  const vitals = useMemo(() => {
    const totalBottles = items.reduce((acc, curr) => acc + curr.units, 0);

    let redsCount = 0;
    let whitesCount = 0;
    let sparklingCount = 0;
    let oldestVintage: number | null = null;

    items.forEach((item) => {
      if (item.bottle === 'white' || item.bottle === 'white-flute') {
        whitesCount += item.units;
      } else if (item.bottle === 'sparkling') {
        sparklingCount += item.units;
      } else {
        redsCount += item.units;
      }

      if (item.vintage != null) {
        if (oldestVintage === null || item.vintage < oldestVintage) {
          oldestVintage = item.vintage;
        }
      }
    });

    const currentYear = new Date().getFullYear();
    const oldestVintageAgingYears = oldestVintage != null ? Math.max(0, currentYear - oldestVintage) : null;

    return {
      totalBottles,
      redsCount,
      whitesCount,
      sparklingCount,
      optimalCount: null,
      dominantVarietal: null,
      dominantVarietalPercentage: null,
      oldestVintage,
      oldestVintageAgingYears,
    };
  }, [items]);

  // Filtrado y Ordenamiento
  const jewelsCount = useMemo(() => items.filter((w) => w.isJewel).length, [items]);

  const displayedWines = useMemo(() => {
    let list = [...items];
    if (activeTab === 'jewels') {
      list = list.filter((w) => w.isJewel);
    }

    if (sortOption === 'vintage-desc') {
      return list.sort((a, b) => (b.vintage ?? -1) - (a.vintage ?? -1));
    }
    if (sortOption === 'vintage-asc') {
      return list.sort((a, b) => (a.vintage ?? 9999) - (b.vintage ?? 9999));
    }
    return list;
  }, [items, activeTab, sortOption]);

  const activeCellar = cellars.find((c) => c.id === selectedCellarId);
  const displayName = user?.username || user?.email?.split('@')[0] || 'Coleccionista';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Halo ambiental vinícola superior */}
      <div
        className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full pointer-events-none opacity-25 blur-[140px] bg-gradient-to-b from-[#722F37] via-[#201f21] to-transparent z-0"
        aria-hidden="true"
      />

      {/* Toast de Notificación Flotante */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-700/80 bg-[#16161c] text-neutral-100 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-[#fbbf24] shrink-0" />
          <p className="text-xs font-medium font-sans">{notification}</p>
        </aside>
      )}

      {/* 1. Navbar Superior */}
      <DashboardNavbar stockCount={vitals.totalBottles} />

      {/* 2. Contenido Principal */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10 px-4 sm:px-6 lg:px-8 pb-24 pt-24 sm:pt-28 relative z-10">
        {/* Encabezado y Selector de Cavas */}
        <VaultHeader
          userName={displayName}
          cellars={cellars}
          selectedCellarId={selectedCellarId}
          onSelectCellar={(id) => setSearchParams({ cava: String(id) }, { replace: true })}
          onOpenCreateCellar={() => {
            setCreateCellarName('');
            setCreateCellarError(null);
            setIsCreateCellarOpen(true);
          }}
          onOpenRenameCellar={handleOpenRename}
          onOpenDeleteCellar={() => {
            setDeleteCellarError(null);
            setIsDeleteCellarOpen(true);
          }}
          onAddBottle={() => setIsQuickAddOpen(true)}
        />

        {/* Estado de Error de Cavas */}
        {cellarsError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cellarsError}</span>
            </div>
            <button
              type="button"
              onClick={loadCellars}
              className="inline-flex items-center gap-1 text-white underline hover:no-underline font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Estado Vacío Sin Cavas (solo si no hay error) */}
        {!cellarsLoading && !cellarsError && cellars.length === 0 ? (
          <section className="p-12 text-center rounded-2xl bg-[#121216] border border-neutral-800 space-y-4 max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-white/10 text-rose-300 flex items-center justify-center mx-auto shadow-sm">
              <Wine className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-neutral-100">
              Crear tu primera cava
            </h2>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed max-w-md mx-auto">
              Organizá tus botellas personales asignándolas a un espacio específico (por ejemplo, «Cava Principal», «Heladera Cava» o «Depto»).
            </p>
            <button
              type="button"
              onClick={() => {
                setCreateCellarName('');
                setCreateCellarError(null);
                setIsCreateCellarOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#85222e] text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
            >
              Crear mi primera cava
            </button>
          </section>
        ) : (
          <>
            {/* Matriz de Métricas Enológicas Vitales */}
            <VaultVitals vitals={vitals} />

            {/* Pestañas y Controles de Tus Botellas */}
            <VaultTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              totalCount={items.length}
              jewelsCount={jewelsCount}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            {/* Error de Carga de Ítems */}
            {itemsError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{itemsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadCellarItems()}
                  className="inline-flex items-center gap-1 text-white underline hover:no-underline font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {/* Pestañas 'optimal' o 'guard' -> Cartel Próximamente */}
            {activeTab === 'optimal' || activeTab === 'guard' ? (
              <div className="p-12 text-center rounded-2xl bg-[#121216] border border-white/5 space-y-3 max-w-lg mx-auto my-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-neutral-100">
                  Próximamente
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Próximamente se mostrará la ventana óptima de consumo de cada botella basada en su potencial de guarda y curva de evolución.
                </p>
              </div>
            ) : (
              /* Grilla de Botellas Reales */
              <section className="space-y-4">
                {itemsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-96 bg-[#121216] border border-neutral-800 rounded-xl" />
                    ))}
                  </div>
                ) : displayedWines.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#121216] border border-neutral-800 space-y-3">
                    <Wine className="w-10 h-10 text-neutral-500 mx-auto" />
                    <h3 className="font-serif text-xl text-neutral-200">
                      {activeTab === 'jewels' ? 'No tenés joyas en esta cava' : 'Tu cava está vacía'}
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                      {activeTab === 'jewels'
                        ? 'Las joyas son aquellas botellas con un puntaje promedio de 4,5 o superior.'
                        : 'Todavía no agregaste botellas a esta cava. Guardalas para llevar su registro de estiba.'}
                    </p>
                    {activeTab !== 'jewels' && (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#85222e] text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ingresar botella</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {displayedWines.map((wine) => (
                      <VaultWineCard
                        key={wine.id}
                        wine={wine}
                        onOpenDetails={(w) => setSelectedDetailsWine(w)}
                        onUncork={handleOpenUncork}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Bitácora de Catas (Conserva su contenido actual) */}
            <div className="pt-2">
              <VaultLogbookModule
                entries={logbookEntries}
                hasMore={hasMoreLogbook}
                onLoadMore={handleLoadMoreLogbook}
                isLoadingMore={logbookLoadingMore}
              />
            </div>
          </>
        )}
      </main>

      {/* 3. Modal de Ficha Técnica de Botella */}
      <TechnicalSheetModal
        wine={selectedDetailsWine}
        onClose={() => setSelectedDetailsWine(null)}
        onBottleUpdated={handleBottleMutated}
        onBottleRemoved={handleBottleMutated}
        onUncork={handleOpenUncork}
      />

      {/* Modal Crear Cava */}
      {isCreateCellarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[#16161b] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif text-lg font-semibold text-neutral-100">Nueva Cava</h3>
              <button
                type="button"
                onClick={() => setIsCreateCellarOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createCellarError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createCellarError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCellarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre de la cava <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  required
                  placeholder="Ej: Cava Subterránea, Casa de Playa..."
                  value={createCellarName}
                  onChange={(e) => setCreateCellarName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCellarOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCellar}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isCreatingCellar ? 'Creando...' : 'Crear cava'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renombrar Cava */}
      {isRenameCellarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[#16161b] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif text-lg font-semibold text-neutral-100">Renombrar Cava</h3>
              <button
                type="button"
                onClick={() => setIsRenameCellarOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renameCellarError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{renameCellarError}</span>
              </div>
            )}

            <form onSubmit={handleRenameCellarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nuevo nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  required
                  value={renameCellarName}
                  onChange={(e) => setRenameCellarName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameCellarOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRenamingCellar}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isRenamingCellar ? 'Guardando...' : 'Guardar nombre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cava */}
      {isDeleteCellarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[#16161b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-neutral-100">
              ¿Eliminar esta cava?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vas a eliminar la cava <span className="text-white font-medium">«{activeCellar?.name}»</span>.
              Recordá que la cava debe estar vacía para poder ser eliminada.
            </p>

            {deleteCellarError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteCellarError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteCellarOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingCellar}
                onClick={handleDeleteCellarSubmit}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeletingCellar ? 'Eliminando...' : 'Eliminar cava'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ingresar Botella (Vista 3B) */}
      <QuickAddBottleModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultCellarId={selectedCellarId ?? undefined}
        onBottleAdded={({ cellarId }) => {
          setIsQuickAddOpen(false);
          setSearchParams({ cava: cellarId.toString() });
          loadCellars();
          loadCellarItems();
        }}
      />

      {/* Modal Descorche */}
      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onDone={handleUncorkDone}
      />

      {/* 4. Footer Editorial */}
      <footer className="border-t border-neutral-900 bg-[#08080a] relative z-10 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold tracking-tight text-neutral-100">
              AyVino<span className="text-[#ffb2b8]">.</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest pl-2 border-l border-neutral-800">
              Alta Cava &amp; Archivo Enológico
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
