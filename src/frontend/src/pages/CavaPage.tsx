import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Wine, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../features/auth';
import type { AppOutletContext } from '../components/layout/AppLayout';
import { UncorkDialog } from '../features/dashboard';
import {
  VaultHeader,
  VaultVitals,
  VaultTabs,
  VaultWineCard,
  VaultLogbookModule,
  TechnicalSheetModal,
  QuickAddBottleModal,
  type CellarWine,
  type CellarVitals,
  type VarietalSegment,
  type WineSortOption,
  type TastingLogEntry,
} from '../features/cava';
import { apiClient } from '../services/apiClient';
import { imageUrl } from '../lib/image';
import { formatRating, normalizeRating } from '../lib/formatRating';
import { getMyUncorks, type UncorkListItemDto } from '../features/wines';
import type { DashboardWine, UncorkSubmission } from '../types/wine';

/**
 * CavaPage Component (/cava)
 * Réplica de alta fidelidad de la experiencia editorial:
 * "Perfil — La Cava Privada del Coleccionista" del proyecto AyVino.
 *
 * Adaptada a la cava personal:
 * - Identidad limpia sin píldoras redundantes y métricas esenciales (Total, Varietal, Añada más antigua).
 * - Sección "Tus botellas" conectada en exclusiva a la API real de AyVino (sin maquetas de muestra).
 * - Módulos complementarios: Sommelier Inteligente, Telemetría Térmica/UV y Bitácora de Catas.
 * - Modales interactivos: Ficha Técnica Enológica, Ingreso Rápido de Botella y Registro de Descorche.
 */
export default function CavaPage() {
  const { user } = useAuth();
  const outletContext = useOutletContext<AppOutletContext | null>();
  const refreshStock = outletContext?.refreshStock;

  // 1. Colección y Datos de Bóveda: 100% datos reales desde la API backend
  const [wines, setWines] = useState<CellarWine[]>([]);
  const [cellarId, setCellarId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tastingLog, setTastingLog] = useState<TastingLogEntry[]>([]);
  const [tastingsPage, setTastingsPage] = useState<number>(1);
  const [hasMoreTastings, setHasMoreTastings] = useState<boolean>(false);
  const [isLoadingMoreTastings, setIsLoadingMoreTastings] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<WineSortOption>('default');
  const [notification, setNotification] = useState<string | null>(null);

  // Modales
  const [selectedDetailsWine, setSelectedDetailsWine] = useState<CellarWine | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showNotification = useCallback((msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

  // Carga desde backend .NET de la cava del usuario
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchBackendCellar = useCallback(() => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCellarData() {
      try {
        const response = await apiClient.get('/cellars/me');
      const cellars = response.data;
      let activeCellarId: number | null = null;
      if (Array.isArray(cellars) && cellars.length > 0 && cellars[0].id) {
        activeCellarId = cellars[0].id;
      } else {
        try {
          const createdRes = await apiClient.post('/cellars', { name: 'Mi Cava' });
          if (createdRes.data?.id) {
            activeCellarId = createdRes.data.id;
          }
        } catch {
          // Manejo silencioso si ya existe o hay concurrencia
        }
      }

      if (activeCellarId) {
        setCellarId(activeCellarId);
        const itemsResponse = await apiClient.get(`/cellars/${activeCellarId}/items`);
        const items = itemsResponse.data;
        if (Array.isArray(items)) {
          const mapped: CellarWine[] = items.map((item, idx) => {
            const userRatingNum = item.userRating !== null && item.userRating !== undefined ? Number(item.userRating) : null;
            const avgRatingNum = item.averageRating !== null && item.averageRating !== undefined ? Number(item.averageRating) : null;
            const score100 = userRatingNum !== null
              ? Math.round(userRatingNum * 20)
              : (avgRatingNum !== null ? Math.round(avgRatingNum * 20) : undefined);
            return {
              id: `api-item-${item.wineVintageId || idx}`,
              wineId: item.wineId,
              wineVintageId: item.wineVintageId,
              name: item.name || '—',
              winery: item.wineryName || item.wineryNameText || '—',
              region: item.regionName || '—',
              varietal: item.grapeName?.trim() || '—',
              grapeName: item.grapeName?.trim() || null,
              wineType: item.wineType || null,
              vintage: item.year || 0,
              rating: score100 || 0,
              userRating: userRatingNum,
              averageRating: avgRatingNum,
              criticBadge: userRatingNum !== null ? undefined : (score100 ? `AY ${score100}` : undefined),
              units: item.quantity || 1,
              location: item.notes || '—',
              temperatureConst: '15°C CONSTANTE',
              agingStatus: item.year && item.year <= 2019 ? 'optimal' : 'aging',
              agingStatusLabel:
                item.year && item.year <= 2019 ? 'Ventana Óptima' : 'En Guarda Prolongada',
              isJewel: (avgRatingNum !== null && avgRatingNum >= 4.5) || false,
              sourceType: item.wineryId ? 'Official' : 'Community',
              bottle: item.wineType === 'White' ? 'white' : 'red-burgundy',
              imageUrl: (item.imageId ? imageUrl(item.imageId, 'detail') : item.imageUrl) || undefined,
              imageId: item.imageId,
            };
          });
          setWines(mapped);
        } else {
          setWines([]);
        }
      } else {
        setWines([]);
      }

      // Cargar la bitácora de descorches persistente desde la API unificada de Uncorks (U14A/U14B)
      try {
        const uncorks = await getMyUncorks({ pageNumber: 1, pageSize: 10 });
        if (Array.isArray(uncorks) && isMounted) {
          const mappedLogs: TastingLogEntry[] = uncorks.map((item: UncorkListItemDto) => {
            const dateStr = item.uncorkedAt
              ? new Date(item.uncorkedAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).toUpperCase()
              : new Date().toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).toUpperCase();

            return {
              id: `uncork-${item.id}`,
              wineName: `${item.wineName}${item.year ? ` (${item.year})` : ''}`,
              criticScore: item.rating !== null && item.rating !== undefined && item.rating > 0
                ? `TU RESEÑA ${formatRating(item.rating)} ★`
                : 'SIN CALIFICACIÓN',
              uncorkDate: `DESCORCHADO EL ${dateStr}`,
              notes:
                item.comment?.trim() ||
                'Sin notas de cata registradas en la reseña.',
              sight: 'Límpido y brillante',
              agingRemaining: item.wineryName || 'Bodega certificada',
              ratingValue: item.rating ? Math.round(item.rating) : 0,
            };
          });
          setTastingLog(mappedLogs);
          setHasMoreTastings(uncorks.length >= 10);
          setTastingsPage(1);
        }
      } catch (err: unknown) {
        let errorMsg = 'No pudimos sincronizar la bitácora de descorches.';
        if (axios.isAxiosError(err)) {
          errorMsg = err.response?.data?.detail || err.response?.data?.message || errorMsg;
        }
        if (isMounted) {
          showNotification(errorMsg);
        }
      }
    } catch (err: unknown) {
      if (isMounted) {
        setWines([]);
      }
      let errorMsg = 'No pudimos cargar los vinos de tu cava.';
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.response?.data?.message || errorMsg;
      }
      showNotification(errorMsg);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  void loadCellarData();

  return () => {
    isMounted = false;
  };
}, [reloadTrigger, showNotification]);

  // 2. Cálculo reactivo de Métricas Vitales de la Cava
  const vitals = useMemo((): CellarVitals => {
    const totalBottles = wines.reduce((acc, curr) => acc + curr.units, 0);

    const emptyResult: CellarVitals = {
      totalBottles: 0,
      redsCount: 0,
      whitesCount: 0,
      sparklingCount: 0,
      othersCount: 0,
      optimalCount: 0,
      dominantVarietal: '—',
      dominantVarietalPercentage: 0,
      undeclaredGrapeBottles: 0,
      varietalSegments: [],
      oldestVintage: null,
      oldestVintageAgingYears: 0,
    };

    if (totalBottles === 0 || wines.length === 0) {
      return emptyResult;
    }

    const getWineTypeCategory = (type: string | number | null | undefined): 'Red' | 'White' | 'Sparkling' | 'Other' => {
      if (!type) return 'Other';
      const s = String(type).trim().toLowerCase();
      if (s === '1' || s === 'red' || s === 'tinto' || s === 'tintos') return 'Red';
      if (s === '2' || s === 'white' || s === 'blanco' || s === 'blancos') return 'White';
      if (s === '4' || s === 'sparkling' || s === 'espumoso' || s === 'espumosos' || s === 'esp.' || s === 'espumante') return 'Sparkling';
      return 'Other';
    };

    let redsCount = 0;
    let whitesCount = 0;
    let sparklingCount = 0;
    let othersCount = 0;
    let optimalCount = 0;
    let oldestVintage: number | null = null;

    // Total en Cava: clasificar cada botella por su wineType del backend
    wines.forEach((w) => {
      const typeCategory = getWineTypeCategory(w.wineType);
      if (typeCategory === 'Red') {
        redsCount += w.units;
      } else if (typeCategory === 'White') {
        whitesCount += w.units;
      } else if (typeCategory === 'Sparkling') {
        sparklingCount += w.units;
      } else {
        othersCount += w.units;
      }

      if (w.agingStatus === 'optimal') {
        optimalCount += 1;
      }

      if (w.vintage && w.vintage > 1800 && w.units > 0) {
        if (oldestVintage === null || w.vintage < oldestVintage) {
          oldestVintage = w.vintage;
        }
      }
    });

    const currentYear = new Date().getFullYear();
    const oldestVintageAgingYears = oldestVintage !== null ? Math.max(0, currentYear - oldestVintage) : 0;

    // Conteo por uva principal (grapeName declarado)
    let declaredBottlesTotal = 0;
    const grapeMap: Record<string, { count: number; typeCounts: Record<string, number> }> = {};

    wines.forEach((w) => {
      const grape = w.grapeName?.trim();
      if (grape && grape !== '—') {
        declaredBottlesTotal += w.units;
        if (!grapeMap[grape]) {
          grapeMap[grape] = { count: 0, typeCounts: {} };
        }
        grapeMap[grape].count += w.units;
        const typeCategory = getWineTypeCategory(w.wineType);
        grapeMap[grape].typeCounts[typeCategory] = (grapeMap[grape].typeCounts[typeCategory] || 0) + w.units;
      }
    });

    const undeclaredGrapeBottles = totalBottles - declaredBottlesTotal;

    if (declaredBottlesTotal === 0) {
      return {
        totalBottles,
        redsCount,
        whitesCount,
        sparklingCount,
        othersCount,
        optimalCount,
        dominantVarietal: '—',
        dominantVarietalPercentage: 0,
        undeclaredGrapeBottles,
        varietalSegments: [],
        oldestVintage,
        oldestVintageAgingYears,
      };
    }

    // Ordenar uvas de mayor a menor cantidad
    const sortedGrapes = Object.entries(grapeMap)
      .map(([name, data]) => {
        let dominantType: 'Red' | 'White' | 'Sparkling' | 'Other' = 'Red';
        let maxTypeCount = -1;
        Object.entries(data.typeCounts).forEach(([t, cnt]) => {
          if (cnt > maxTypeCount) {
            maxTypeCount = cnt;
            dominantType = t as 'Red' | 'White' | 'Sparkling' | 'Other';
          }
        });
        return {
          name,
          count: data.count,
          dominantType,
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    // Empates en primer lugar
    const maxCount = sortedGrapes[0].count;
    const tiedGrapes = sortedGrapes.filter((g) => g.count === maxCount);
    const dominantVarietal = tiedGrapes.map((g) => g.name).join(' · ');
    const dominantVarietalPercentage = Math.round((maxCount / declaredBottlesTotal) * 100);

    // Barra segmentada real: hasta 3 uvas y tramo "Otros" (sobrante si existe)
    const top3 = sortedGrapes.slice(0, 3);
    const remainder = sortedGrapes.slice(3);
    const remainderCount = remainder.reduce((acc, g) => acc + g.count, 0);

    const colorByType: Record<string, string> = {
      Red: '#722F37',
      White: '#fbbf24',
      Sparkling: '#d1d5db',
      Other: '#525252',
    };

    const opacityLevels = [1, 0.7, 0.45];
    const typeUsageCount: Record<string, number> = {};

    const varietalSegments: VarietalSegment[] = top3.map((g) => {
      const typeIndex = typeUsageCount[g.dominantType] || 0;
      typeUsageCount[g.dominantType] = typeIndex + 1;
      const opacity = opacityLevels[Math.min(typeIndex, opacityLevels.length - 1)];

      return {
        name: g.name,
        bottleCount: g.count,
        percentage: Math.round((g.count / declaredBottlesTotal) * 100),
        wineType: g.dominantType,
        color: colorByType[g.dominantType] || '#722F37',
        opacity,
      };
    });

    if (remainderCount > 0) {
      varietalSegments.push({
        name: 'Otros',
        bottleCount: remainderCount,
        percentage: Math.round((remainderCount / declaredBottlesTotal) * 100),
        wineType: 'Other',
        color: '#525252',
        opacity: 1,
      });
    }

    return {
      totalBottles,
      redsCount,
      whitesCount,
      sparklingCount,
      othersCount,
      optimalCount,
      dominantVarietal,
      dominantVarietalPercentage,
      undeclaredGrapeBottles,
      varietalSegments,
      oldestVintage,
      oldestVintageAgingYears,
    };
  }, [wines]);

  // 3. Ordenamiento de botellas
  const displayedWines = useMemo(() => {
    const list = [...wines];
    if (sortOption === 'vintage-desc') {
      return list.sort((a, b) => b.vintage - a.vintage);
    }
    if (sortOption === 'vintage-asc') {
      return list.sort((a, b) => a.vintage - b.vintage);
    }
    return list;
  }, [wines, sortOption]);

  // Conversión a DashboardWine para compatibilidad con UncorkDialog
  const mapCellarWineToDashboardWine = (w: CellarWine): DashboardWine => ({
    id: w.id,
    wineId: w.wineId,
    wineVintageId: w.wineVintageId,
    name: w.name,
    winery: w.winery,
    region: w.region,
    varietal: w.varietal,
    vintage: w.vintage,
    rating: w.userRating !== null && w.userRating !== undefined
      ? w.userRating
      : (w.averageRating !== null && w.averageRating !== undefined
          ? w.averageRating
          : (w.rating > 5 ? Number((w.rating / 20).toFixed(1)) : w.rating)),
    units: w.units,
    location: w.location,
    bottle: w.bottle,
    imageUrl: w.imageUrl,
    imageId: w.imageId,
  });

  const handleUncorkRequested = (w: CellarWine) => {
    setUncorkingWine(mapCellarWineToDashboardWine(w));
  };

  const handleLoadMoreTastings = async () => {
    if (isLoadingMoreTastings || !hasMoreTastings) return;
    setIsLoadingMoreTastings(true);
    try {
      const nextPage = tastingsPage + 1;
      const moreUncorks = await getMyUncorks({ pageNumber: nextPage, pageSize: 10 });
      if (Array.isArray(moreUncorks)) {
        const mappedLogs: TastingLogEntry[] = moreUncorks.map((item: UncorkListItemDto) => {
          const dateStr = item.uncorkedAt
            ? new Date(item.uncorkedAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).toUpperCase()
            : new Date().toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).toUpperCase();

          return {
            id: `uncork-${item.id}`,
            wineName: `${item.wineName}${item.year ? ` (${item.year})` : ''}`,
            criticScore: item.rating !== null && item.rating !== undefined && item.rating > 0
              ? `TU RESEÑA ${formatRating(item.rating)} ★`
              : 'SIN CALIFICACIÓN',
            uncorkDate: `DESCORCHADO EL ${dateStr}`,
            notes:
              item.comment?.trim() ||
              'Sin notas de cata registradas en la reseña.',
            sight: 'Límpido y brillante',
            agingRemaining: item.wineryName || 'Bodega certificada',
            ratingValue: item.rating ? Math.round(item.rating) : 0,
          };
        });
        setTastingLog((prev) => [...prev, ...mappedLogs]);
        setTastingsPage(nextPage);
        setHasMoreTastings(moreUncorks.length >= 10);
      }
    } catch (err: unknown) {
      let errorMsg = 'No pudimos cargar más descorches.';
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.response?.data?.message || errorMsg;
      }
      showNotification(errorMsg);
    } finally {
      setIsLoadingMoreTastings(false);
    }
  };

  const handleUncorkSaved = async (data: UncorkSubmission) => {
    const vintageId = data.wine.wineVintageId ?? Number(data.wine.id ? data.wine.id.replace('api-item-', '') : NaN);
    if (isNaN(vintageId) || vintageId <= 0 || !cellarId) {
      showNotification('No se pudo identificar la botella para descorchar.');
      return;
    }

    try {
      const normalizedRating = data.rating !== null ? normalizeRating(data.rating) : null;
      const comment = (normalizedRating !== null && data.tastingNotes?.trim()) ? data.tastingNotes.trim() : (data.occasion?.trim() || undefined);

      await apiClient.post(`/cellars/${cellarId}/items/${vintageId}/uncork`, {
        rating: normalizedRating,
        comment,
      });

      showNotification(
        normalizedRating !== null
          ? `¡Descorche registrado! ${data.wine.name} calificado con ${formatRating(normalizedRating)} ★.`
          : `¡Descorche registrado! ${data.wine.name}.`
      );

      // Sincronizar Cava y Bitácora desde backend y actualizar contador de la Navbar
      await fetchBackendCellar();
      if (refreshStock) {
        await refreshStock();
      }
    } catch (err: unknown) {
      let errorMsg = 'Error al descorchar la botella.';
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.response?.data?.message || errorMsg;
      }
      showNotification(errorMsg);
    }
  };

  const handleAddBottle = async () => {
    await fetchBackendCellar();
    if (refreshStock) {
      await refreshStock();
    }
  };

  // Nombre personalizado del sommelier/usuario
  const displayName = user?.username || user?.email?.split('@')[0] || 'Nehuen';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Halo ambiental vinícola superior de fondo (Atmospheric Background Halo) */}
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

      {/* 2. Contenido Principal de Cava Privada */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10 px-4 sm:px-6 lg:px-8 pb-24 pt-24 sm:pt-28 relative z-10">
        {/* Encabezado Editorial de Bóveda */}
        <VaultHeader
          userName={displayName}
          onAddBottle={() => setIsQuickAddOpen(true)}
        />

        {/* Matriz de Métricas Enológicas Vitales (Reorganizada en 3 cards) */}
        <VaultVitals vitals={vitals} />

        {/* Encabezado y Barra de Control de Tus Botellas */}
        <VaultTabs
          totalCount={wines.length}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        {/* Grilla / Mosaico de Botellas */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="p-16 text-center rounded-xl bg-[#121216] border border-neutral-800 space-y-3">
              <Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin mx-auto" />
              <p className="font-mono text-xs text-neutral-400">Cargando inventario de la cava...</p>
            </div>
          ) : displayedWines.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#121216] border border-neutral-800 space-y-3">
              <Wine className="w-10 h-10 text-neutral-500 mx-auto" />
              <h3 className="font-serif text-xl text-neutral-200">Tu cava está vacía</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Agregá tus botellas personales para guardarlas bajo registro de estiba y consultarlas cuando quieras descorchar.
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Ingresar primera botella
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {displayedWines.map((wine) => (
                <VaultWineCard
                  key={wine.id}
                  wine={wine}
                  onOpenDetails={(w) => setSelectedDetailsWine(w)}
                  onUncork={(w) => handleUncorkRequested(w)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Bitácora de Catas / Última Reseña Registrada */}
        <div className="pt-2">
          <VaultLogbookModule
            entries={tastingLog}
            onLoadMore={handleLoadMoreTastings}
            hasMore={hasMoreTastings}
            isLoadingMore={isLoadingMoreTastings}
          />
        </div>
      </main>

      {/* 3. Modales Interactivos */}
      <TechnicalSheetModal
        wine={selectedDetailsWine}
        onClose={() => setSelectedDetailsWine(null)}
        onUncork={(w) => handleUncorkRequested(w)}
      />

      <QuickAddBottleModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddBottle={handleAddBottle}
        showToast={showNotification}
      />

      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
      />
    </div>
  );
}
