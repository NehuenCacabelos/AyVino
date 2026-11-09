import { useState, useRef, useEffect, useMemo } from 'react';
import { Wine } from 'lucide-react';
import { useAuth } from '../features/auth';
import { DashboardNavbar, UncorkDialog } from '../features/dashboard';
import {
  VaultHeader,
  VaultVitals,
  VaultTabs,
  VaultWineCard,
  VaultLogbookModule,
  TechnicalSheetModal,
  QuickAddBottleModal,
  initialTastingLog,
  type CellarWine,
  type WineSortOption,
  type QuickAddBottlePayload,
  type TastingLogEntry,
} from '../features/cava';
import { apiClient } from '../services/apiClient';
import { imageUrl } from '../lib/image';
import type { DashboardWine, UncorkSubmission } from '../types/wine';

/**
 * CavaPage Component (/cava)
 * Réplica de alta fidelidad de la experiencia editorial:
 * "Perfil — La Cava Privada del Coleccionista" del proyecto AyVino.
 *
 * Adaptada a la cava personal:
 * - Identidad limpia sin píldoras redundantes y métricas esenciales (Total, Varietal, Añada más antigua).
 * - Sección "Tus botellas" con listado integral y ordenamiento ágil por cosecha.
 * - Módulos complementarios: Sommelier Inteligente, Telemetría Térmica/UV y Bitácora de Catas.
 * - Modales interactivos: Ficha Técnica Enológica, Ingreso Rápido de Botella y Registro de Descorche.
 */
export default function CavaPage() {
  const { user } = useAuth();

  // 1. Colección y Datos de Bóveda sincronizados con Backend .NET
  const [wines, setWines] = useState<CellarWine[]>([]);
  const [cellarId, setCellarId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tastingLog, setTastingLog] = useState<TastingLogEntry[]>(() => {
    const saved = localStorage.getItem('ayvino_vault_logbook');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialTastingLog;
      }
    }
    return initialTastingLog;
  });

  const [sortOption, setSortOption] = useState<WineSortOption>('default');
  const [notification, setNotification] = useState<string | null>(null);

  // Modales
  const [selectedDetailsWine, setSelectedDetailsWine] = useState<CellarWine | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('ayvino_vault_logbook', JSON.stringify(tastingLog));
  }, [tastingLog]);

  useEffect(() => {
    return () => {
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

  // Carga desde backend .NET de la cava del usuario
  useEffect(() => {
    let isMounted = true;
    async function fetchBackendCellar() {
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
            // Manejo silencioso si ya existe o hay carrera
          }
        }

        if (activeCellarId && isMounted) {
          setCellarId(activeCellarId);
          const itemsResponse = await apiClient.get(`/cellars/${activeCellarId}/items`);
          const items = itemsResponse.data;
          if (Array.isArray(items) && isMounted) {
            const mapped: CellarWine[] = items.map((item, idx) => ({
              id: `api-item-${item.wineVintageId || idx}`,
              name: item.name || 'Etiqueta de Colección',
              winery: item.wineryNameText || 'Bodega Argentina',
              region: 'Mendoza, Argentina',
              varietal: item.wineType || 'Malbec',
              vintage: item.year || 2020,
              rating: item.averageRating ? Math.round(Number(item.averageRating) * 20) : 92,
              criticBadge: item.averageRating ? `AY ${Math.round(Number(item.averageRating) * 20)}` : undefined,
              units: item.quantity || 1,
              location: item.notes || `ESTANTE #${idx + 1}`,
              temperatureConst: '15°C CONSTANTE',
              agingStatus: item.year && item.year <= 2019 ? 'optimal' : 'aging',
              agingStatusLabel: item.year && item.year <= 2019 ? 'Ventana Óptima' : 'En Guarda Prolongada',
              isJewel: (item.averageRating && Number(item.averageRating) >= 4.5) || false,
              sourceType: item.wineryId ? 'Official' : 'Community',
              bottle: item.wineType === 'White' ? 'white' : 'red-burgundy',
              imageUrl: (item.imageId ? imageUrl(item.imageId, 'bottle') : item.imageUrl) || undefined,
            }));
            setWines(mapped);
          }
        }
      } catch {
        // Fallback silencioso en caso de desconexión
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBackendCellar();
    return () => {
      isMounted = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 2. Cálculo reactivo de Métricas Vitales de la Cava
  const vitals = useMemo(() => {
    const totalBottles = wines.reduce((acc, curr) => acc + curr.units, 0);

    let redsCount = 0;
    let whitesCount = 0;
    let sparklingCount = 0;
    let optimalCount = 0;
    let oldestVintage = 2030;
    const varietalCounts: Record<string, number> = {};

    wines.forEach((w) => {
      const v = (w.varietal || '').toLowerCase();
      if (v.includes('blanco') || v.includes('chardonnay') || v.includes('torrontés') || w.bottle.includes('white')) {
        whitesCount += w.units;
      } else if (v.includes('espumante') || v.includes('champagne') || w.bottle === 'sparkling') {
        sparklingCount += w.units;
      } else {
        redsCount += w.units;
      }

      if (w.agingStatus === 'optimal') {
        optimalCount += 1;
      }

      if (w.vintage && w.vintage < oldestVintage) {
        oldestVintage = w.vintage;
      }

      const mainVarietal = w.varietal || 'Malbec';
      varietalCounts[mainVarietal] = (varietalCounts[mainVarietal] || 0) + w.units;
    });

    if (oldestVintage === 2030) oldestVintage = 2017;

    // Calcular varietal dominante
    let dominantVarietal = 'Malbec';
    let maxCount = 0;
    Object.entries(varietalCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantVarietal = name;
      }
    });

    const dominantVarietalPercentage = totalBottles > 0
      ? Math.round((maxCount / totalBottles) * 100)
      : 55;

    const currentYear = new Date().getFullYear();
    const oldestVintageAgingYears = Math.max(1, currentYear - oldestVintage);

    return {
      totalBottles,
      redsCount,
      whitesCount,
      sparklingCount,
      optimalCount,
      dominantVarietal,
      dominantVarietalPercentage,
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
    name: w.name,
    winery: w.winery,
    region: w.region,
    varietal: w.varietal,
    vintage: w.vintage,
    rating: w.rating > 5 ? Number((w.rating / 20).toFixed(1)) : w.rating,
    units: w.units,
    location: w.location,
    bottle: w.bottle,
    imageUrl: w.imageUrl,
  });

  const handleUncorkRequested = (w: CellarWine) => {
    setUncorkingWine(mapCellarWineToDashboardWine(w));
  };

  const handleUncorkSaved = (data: UncorkSubmission) => {
    // 1. Reducir stock de la botella
    setWines((prev) =>
      prev
        .map((w) => {
          if (w.name === data.wine.name || w.id === data.wine.id) {
            return { ...w, units: Math.max(0, w.units - 1) };
          }
          return w;
        })
        .filter((w) => w.units > 0)
    );

    // 2. Persistir decremento en el backend si tenemos cellarId y ID numérico
    const vintageId = Number(data.wine.id.replace('api-item-', ''));
    if (!isNaN(vintageId) && vintageId > 0 && cellarId) {
      const current = wines.find((w) => w.id === data.wine.id);
      if (current) {
        const remaining = current.units - 1;
        if (remaining <= 0) {
          apiClient.delete(`/cellars/${cellarId}/items/${vintageId}`).catch(() => {});
        } else {
          apiClient.put(`/cellars/${cellarId}/items/${vintageId}`, {
            quantity: remaining,
            notes: current.location,
          }).catch(() => {});
        }
      }
    }

    // 3. Registrar en la bitácora de cata
    const newEntry: TastingLogEntry = {
      id: `log-${Date.now()}`,
      wineName: `${data.wine.name} (${data.wine.vintage})`,
      criticScore: `CATA PRIVADA ${data.rating * 20} PTS`,
      uncorkDate: `DESCORCHADO EL ${new Date().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).toUpperCase()}`,
      notes:
        data.tastingNotes ||
        `Ocasión: ${data.occasion || 'Degustación personal'}. Calificado con ${data.rating} estrellas en cata confidencial.`,
      sight: 'Gran concentración cromática con ribete de evolución noble',
      agingRemaining: 'Consumido en ventana óptima de expresión',
      ratingValue: data.rating,
    };

    setTastingLog((prev) => [newEntry, ...prev]);
    showNotification(`¡Descorche registrado! ${data.wine.name} calificado con ${data.rating} estrellas.`);
  };

  const handleAddBottle = async (payload: QuickAddBottlePayload) => {
    let wineType = 'Red';
    const v = payload.varietal.toLowerCase();
    if (v.includes('blanco') || v.includes('chardonnay') || v.includes('torrontés')) {
      wineType = 'White';
    } else if (v.includes('rosado')) {
      wineType = 'Rose';
    } else if (v.includes('espumante') || v.includes('champagne')) {
      wineType = 'Sparkling';
    } else if (v.includes('naranjo')) {
      wineType = 'Orange';
    }

    const response = await apiClient.post('/cellars/me/quick-add', {
      name: payload.name,
      wineryName: payload.winery,
      wineType,
      year: payload.vintage,
      quantity: payload.units,
      location: payload.location,
      notes: payload.location,
      matchedWineId: payload.matchedWineId ?? null,
    });

    const item = response.data;
    const vintageId = item.wineVintageId;
    const idKey = `api-item-${vintageId}`;

    const score = item.averageRating ? Math.round(Number(item.averageRating) * 20) : 92;
    const isJewelScore = (item.averageRating && Number(item.averageRating) >= 4.5) || false;

    const newWine: CellarWine = {
      id: idKey,
      name: item.name || payload.name,
      winery: item.wineryNameText || payload.winery,
      region: payload.region || 'Mendoza, Argentina',
      varietal: payload.varietal,
      vintage: item.year || payload.vintage,
      rating: score,
      criticBadge: item.averageRating ? `AY ${score}` : undefined,
      units: item.quantity || payload.units,
      location: payload.location || 'A1 · ESTANTE SUP.',
      temperatureConst: '15°C CONSTANTE',
      terroirNote: `${payload.varietal} · Cosecha ${item.year || payload.vintage} · ${item.wineryNameText || payload.winery}`,
      agingStatus: item.year && item.year <= 2019 ? 'optimal' : 'aging',
      agingStatusLabel: item.year && item.year <= 2019 ? 'Ventana Óptima' : 'En Guarda Prolongada',
      isJewel: isJewelScore,
      sourceType: item.wineryId ? 'Official' : 'Community',
      bottle: payload.bottle,
      imageUrl: item.imageId ? imageUrl(item.imageId, 'bottle') : undefined,
      altitude: '1.300 msnm',
      oakAging: 'Crianza en barricas seleccionadas',
      alcoholContent: '14.2% ABV',
      tastingNotes: {
        sight: 'Límpido, denso y brillante con matices vivos.',
        nose: 'Aromas francos de tipicidad varietal y notas tostadas.',
        mouth: 'Equilibrio sedoso, taninos maduros y gran persistencia.',
        pairing: 'Carnes asadas, pastas rellenas o quesos de maduración media.',
      },
    };

    setWines((prev) => {
      const existingIdx = prev.findIndex((w) => w.id === idKey);
      if (existingIdx >= 0) {
        return prev.map((w, idx) => (idx === existingIdx ? { ...w, units: item.quantity || (w.units + payload.units) } : w));
      }
      return [newWine, ...prev];
    });

    showNotification(`¡Etiqueta ${newWine.name} guardada exitosamente en la cava!`);
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

      {/* 1. Navbar Superior Persistente */}
      <DashboardNavbar stockCount={vitals.totalBottles} />

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
          {displayedWines.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#121216] border border-neutral-800 space-y-3">
              <Wine className="w-10 h-10 text-neutral-500 mx-auto" />
              <h3 className="font-serif text-xl text-neutral-200">No hay etiquetas registradas</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Agregá tus botellas personales para guardarlas bajo registro de estiba y consultarlas cuando quieras descorchar.
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#722F37] text-white text-xs font-semibold"
              >
                Ingresar Botella
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
          <VaultLogbookModule entries={tastingLog} />
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
      />

      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
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
