import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  Compass,
  AlertCircle,
  CheckCircle2,
  Star,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import type { BottleKind, DashboardWine } from '../../../types/wine';
import type { QuickAddBottlePayload } from '../types';
import { VARIETALS_CATALOG, resolveWineTypeAndBottle } from '../data/varietalsData';

interface MatchedWineData {
  id: number;
  name: string;
  wineryNameText?: string;
  wineryId?: number | null;
  wineType: string;
  sourceType: string;
  averageRating?: number | null;
  reviewCount: number;
  existingYears: number[];
}

interface CatalogSearchItem {
  id: number;
  name: string;
  wineryId?: number | null;
  wineryName?: string | null;
  wineryNameText?: string | null;
  wineType?: string | null;
  grapeName?: string | null;
  regionName?: string | null;
  stateName?: string | null;
  defaultVintageYear?: number | null;
}

export interface QuickAddBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBottle: (bottle: QuickAddBottlePayload) => Promise<void> | void;
  initialName?: string;
  initialWine?: DashboardWine | null;
}

export default function QuickAddBottleModal({
  isOpen,
  onClose,
  onAddBottle,
  initialName,
  initialWine,
}: QuickAddBottleModalProps) {
  const navigate = useNavigate();

  const [name, setName] = useState(initialWine?.name || initialName || '');
  const [winery, setWinery] = useState(initialWine?.winery || '');
  const [region, setRegion] = useState(initialWine?.region || 'Mendoza, Argentina');
  const [varietal, setVarietal] = useState(initialWine?.varietal || 'Malbec');
  const [vintage, setVintage] = useState<number>(
    initialWine?.vintage ? Number(initialWine.vintage) || 2021 : new Date().getFullYear() - 3,
  );
  const [location, setLocation] = useState('A1 · ESTANTE SUP.');
  const [units, setUnits] = useState<number>(1);
  const [bottleKind, setBottleKind] = useState<BottleKind>(initialWine?.bottle || 'red-burgundy');

  const [matchedWineId, setMatchedWineId] = useState<number | null>(
    initialWine?.id ? parseInt(initialWine.id, 10) : null,
  );
  const [isLocked, setIsLocked] = useState<boolean>(Boolean(initialWine?.id));

  // Render-time prop sync for initialWine
  const [prevInitialWine, setPrevInitialWine] = useState(initialWine);
  if (isOpen && initialWine !== prevInitialWine) {
    setPrevInitialWine(initialWine);
    if (initialWine) {
      setName(initialWine.name);
      setWinery(initialWine.winery || '');
      setRegion(initialWine.region || 'Mendoza, Argentina');
      setVarietal(initialWine.varietal || 'Malbec');
      setVintage(Number(initialWine.vintage) || new Date().getFullYear() - 3);
      setBottleKind(initialWine.bottle || 'red-burgundy');
      const parsedId = initialWine.id ? parseInt(initialWine.id, 10) : null;
      setMatchedWineId(parsedId);
      setIsLocked(Boolean(parsedId));
    }
  }

  // Render-time prop sync for initialName
  const [prevInitialName, setPrevInitialName] = useState(initialName);
  if (isOpen && !initialWine && initialName !== prevInitialName) {
    setPrevInitialName(initialName);
    setName(initialName || '');
  }

  // Sugerencias de búsqueda en vivo (máximo 5)
  const [suggestions, setSuggestions] = useState<CatalogSearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSugIndex, setActiveSugIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Añadas existentes de la etiqueta seleccionada
  const [existingYears, setExistingYears] = useState<number[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedCandidate, setMatchedCandidate] = useState<MatchedWineData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const varietalGroups = useMemo(() => {
    const order: Array<'Tintas' | 'Blancas' | 'Rosados' | 'Espumantes'> = [
      'Tintas',
      'Blancas',
      'Rosados',
      'Espumantes',
    ];
    return order.filter((grp) => VARIETALS_CATALOG.some((v) => v.group === grp));
  }, []);

  // Carga reactiva de sugerencias con debounce de 250 ms y cancelación
  useEffect(() => {
    if (isLocked || !isOpen || name.trim().length < 2) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setIsSearchingSuggestions(true);
      apiClient
        .get<CatalogSearchItem[]>('/wines/search', {
          params: { search: name.trim(), pageSize: 5 },
          signal: controller.signal,
        })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data.slice(0, 5) : [];
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveSugIndex(-1);
        })
        .catch(() => {
          // Ignorar cancelación o error transitorio
        })
        .finally(() => {
          setIsSearchingSuggestions(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, isLocked, isOpen]);

  // Carga de añadas existentes para el vino asociado
  useEffect(() => {
    if (!matchedWineId) {
      return;
    }

    const controller = new AbortController();

    apiClient
      .get<{ year?: number | null }[]>(`/wines/${matchedWineId}/vintages`, {
        signal: controller.signal,
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          const years = res.data
            .map((v) => v.year)
            .filter((y): y is number => typeof y === 'number' && y > 0)
            .sort((a, b) => b - a);
          setExistingYears(years);
          if (years.length > 0) {
            setVintage((prev) => (years.includes(prev) ? prev : years[0]));
          }
        }
      })
      .catch(() => {
        // Ignorar si falla o aborta
      })
      .finally(() => {
        setIsLoadingYears(false);
      });

    return () => {
      controller.abort();
    };
  }, [matchedWineId]);

  if (!isOpen) {
    return null;
  }

  const handleResetAndClose = () => {
    setName('');
    setWinery('');
    setRegion('Mendoza, Argentina');
    setVarietal('Malbec');
    setVintage(new Date().getFullYear() - 3);
    setLocation('A1 · ESTANTE SUP.');
    setUnits(1);
    setBottleKind('red-burgundy');
    setMatchedWineId(null);
    setIsLocked(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setExistingYears([]);
    setMatchedCandidate(null);
    setErrorMessage(null);
    setIsChecking(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSelectSuggestion = (item: CatalogSearchItem) => {
    setName(item.name);
    setWinery(item.wineryName || item.wineryNameText || '');
    setRegion(item.regionName || item.stateName || 'Mendoza, Argentina');
    setVarietal(item.grapeName || item.wineType || 'Malbec');
    const { bottleKind: resolvedBottle } = resolveWineTypeAndBottle(
      item.grapeName || item.wineType || 'Malbec',
    );
    setBottleKind(resolvedBottle);
    if (item.defaultVintageYear) {
      setVintage(item.defaultVintageYear);
    }
    setMatchedWineId(item.id);
    setIsLocked(true);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleUnlockAndClear = () => {
    setIsLocked(false);
    setMatchedWineId(null);
    setExistingYears([]);
    setName('');
    setWinery('');
    setRegion('Mendoza, Argentina');
    setVarietal('Malbec');
    setVintage(new Date().getFullYear() - 3);
    setBottleKind('red-burgundy');
  };

  const handleKeyDownName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSugIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSugIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeSugIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeSugIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si ya está bloqueado con un vino existente, guardar directamente
    if (isLocked && matchedWineId) {
      await executeSave(matchedWineId);
      return;
    }

    if (!name.trim() || !winery.trim()) {
      setErrorMessage('Por favor completá el nombre del vino y de la bodega.');
      return;
    }

    setErrorMessage(null);
    setIsChecking(true);

    try {
      const response = await apiClient.get<{
        hasMatch: boolean;
        matchedWine?: {
          id: number;
          name: string;
          wineryNameText?: string;
          wineryId?: number | null;
          wineType: string;
          sourceType: string;
          averageRating?: number | null;
          reviewCount: number;
        } | null;
        existingYears: number[];
      }>('/wines/check-duplicate', {
        params: {
          name: name.trim(),
          winery: winery.trim(),
        },
      });

      if (response.data.hasMatch && response.data.matchedWine) {
        setMatchedCandidate({
          ...response.data.matchedWine,
          existingYears: response.data.existingYears || [],
        });
        setIsChecking(false);
        return;
      }
    } catch {
      // Si la verificación falla por red/transitorio, procede a guardar como comunitario
    } finally {
      setIsChecking(false);
    }

    await executeSave(null);
  };

  const executeSave = async (matchedWineIdToSave: number | null) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onAddBottle({
        name: name.trim(),
        winery: winery.trim(),
        region: region.trim(),
        varietal,
        vintage: Number(vintage) || 2021,
        location: location.trim(),
        units: Math.max(1, Number(units) || 1),
        isJewel: false,
        bottle: bottleKind,
        matchedWineId: matchedWineIdToSave,
      });

      handleResetAndClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la botella en la cava.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#fbbf24]" />
            <h3 className="font-serif text-xl text-neutral-100 font-semibold">
              {matchedCandidate
                ? 'Verificación de Etiqueta Existente'
                : isLocked
                  ? 'Ingresar Botella de Vino Existente'
                  : 'Ingresar Lote / Botella a la Cava'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalog Shortcut Banner (Solo cuando no está bloqueado ni en verificación) */}
        {!matchedCandidate && !isLocked && (
          <div className="bg-[#18181f] border-b border-neutral-800/80 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Compass className="w-4 h-4 text-[#fbbf24] shrink-0" />
              <span>¿Buscás una etiqueta curada con ficha técnica oficial?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                handleResetAndClose();
                navigate('/catalogo');
              }}
              className="text-xs font-semibold text-[#fbbf24] hover:text-[#fde68a] hover:underline whitespace-nowrap transition-colors"
            >
              Explorar en Catálogo &rarr;
            </button>
          </div>
        )}

        {/* Banner de Vino Seleccionado / Bloqueado */}
        {isLocked && !matchedCandidate && (
          <div className="bg-amber-950/30 border-b border-amber-800/40 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Etiqueta del catálogo institucional seleccionada. Datos base protegidos.</span>
            </div>
            <button
              type="button"
              onClick={handleUnlockAndClear}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline whitespace-nowrap transition-colors cursor-pointer"
            >
              Cambiar vino
            </button>
          </div>
        )}

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mx-5 mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VISTA 1: Confirmación de Coincidencia Detectada */}
        {matchedCandidate ? (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono">
                <span>Coincidencia encontrada</span>
              </div>
              <h4 className="font-serif text-lg text-neutral-100 font-semibold pt-1">
                ¿Te referís a esta etiqueta ya registrada?
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Encontramos una etiqueta en nuestra base con nombre y bodega coincidentes. Podés asociar tu botella a esta etiqueta o dar de alta una nueva versión comunitaria independiente.
              </p>
            </div>

            {/* Tarjeta del Vino Encontrado */}
            <div className="p-4 rounded-xl bg-[#17161c] border border-neutral-700/70 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                    {matchedCandidate.wineryNameText || 'Bodega Registrada'} · {matchedCandidate.wineType}
                  </span>
                  <h5 className="font-serif text-base font-semibold text-neutral-100">
                    {matchedCandidate.name}
                  </h5>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded border uppercase text-zinc-300 bg-neutral-800 border-neutral-700">
                  {matchedCandidate.sourceType === 'Community' ? 'Comunidad' : 'Oficial'}
                </span>
              </div>

              {/* Métricas y Cosecha */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
                <div className="flex items-center gap-1.5 text-amber-200 font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" />
                  <span className="font-semibold">
                    {matchedCandidate.averageRating ? matchedCandidate.averageRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    ({matchedCandidate.reviewCount} catas)
                  </span>
                </div>

                <span className="font-mono text-[11px] text-neutral-400">
                  {matchedCandidate.existingYears.includes(Number(vintage))
                    ? `Añada ${vintage} registrada`
                    : `Añada ${vintage} nueva para esta etiqueta`}
                </span>
              </div>
            </div>

            {/* Botones de Decisión */}
            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMatchedCandidate(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a editar</span>
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => executeSave(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  No, crear como nuevo vino
                </button>
                <button
                  type="button"
                  onClick={() => executeSave(matchedCandidate.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sí, es este vino</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA 2: Formulario Principal de Ingreso */
          <form onSubmit={handleInitialSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Nombre de la etiqueta con buscador de sugerencias */}
            <div ref={searchContainerRef} className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="wine-name"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Nombre de la Etiqueta *
                </label>
                {isSearchingSuggestions && (
                  <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#fbbf24]" />
                    <span>Buscando...</span>
                  </span>
                )}
              </div>

              <input
                id="wine-name"
                type="text"
                required
                disabled={isLocked}
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (val.trim().length < 2) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (!isLocked && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDownName}
                placeholder="Ej. Adrianna Vineyard River Stones"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-controls="quickadd-suggestions"
                aria-activedescendant={
                  activeSugIndex >= 0 ? `quickadd-sug-${activeSugIndex}` : undefined
                }
                className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                  isLocked
                    ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:border-[#722F37]'
                }`}
              />

              {/* Menú Desplegable de Sugerencias de Vinos Existentes */}
              {showSuggestions && suggestions.length > 0 && !isLocked && (
                <ul
                  role="listbox"
                  id="quickadd-suggestions"
                  aria-label="Sugerencias de vinos registrados"
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-white/[0.12] bg-[#141417]/95 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/[0.06]"
                >
                  {suggestions.map((sug, idx) => (
                    <li
                      key={sug.id}
                      role="option"
                      id={`quickadd-sug-${idx}`}
                      aria-selected={idx === activeSugIndex}
                      onClick={() => handleSelectSuggestion(sug)}
                      onMouseEnter={() => setActiveSugIndex(idx)}
                      className={`p-3 cursor-pointer text-left transition-colors flex items-center justify-between gap-3 ${
                        idx === activeSugIndex ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-semibold text-neutral-100 truncate">
                          {sug.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 truncate">
                          {sug.wineryName || sug.wineryNameText || 'Bodega'} ·{' '}
                          {sug.regionName || sug.stateName || 'Argentina'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 shrink-0">
                        {sug.grapeName || sug.wineType || 'Vino'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bodega y Región */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="wine-winery"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Bodega Productora *
                </label>
                <input
                  id="wine-winery"
                  type="text"
                  required
                  disabled={isLocked}
                  value={winery}
                  onChange={(e) => setWinery(e.target.value)}
                  placeholder="Ej. Catena Zapata"
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLocked
                      ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:border-[#722F37]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="wine-region"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Región / Valle
                </label>
                <input
                  id="wine-region"
                  type="text"
                  disabled={isLocked}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Ej. Gualtallary, Valle de Uco"
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLocked
                      ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:border-[#722F37]'
                  }`}
                />
              </div>
            </div>

            {/* Varietal y Añada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="wine-varietal"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Varietal / Tipo *
                </label>
                <select
                  id="wine-varietal"
                  disabled={isLocked}
                  value={varietal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVarietal(val);
                    const { bottleKind: resolvedBottle } = resolveWineTypeAndBottle(val);
                    setBottleKind(resolvedBottle);
                  }}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLocked
                      ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 focus:border-[#722F37]'
                  }`}
                >
                  {varietalGroups.map((groupName) => (
                    <optgroup
                      key={groupName}
                      label={groupName}
                      className="bg-[#17161c] text-neutral-300 font-semibold"
                    >
                      {VARIETALS_CATALOG.filter((item) => item.group === groupName).map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                          className="bg-[#0a0a0c] text-neutral-100 font-normal"
                        >
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="wine-vintage"
                    className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                  >
                    Añada (Cosecha)
                  </label>
                  {isLoadingYears && (
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-[#fbbf24]" />
                      <span>Añadas...</span>
                    </span>
                  )}
                </div>

                {isLocked && existingYears.length > 0 ? (
                  <select
                    id="wine-vintage"
                    value={vintage}
                    onChange={(e) => setVintage(Number(e.target.value))}
                    className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
                  >
                    {existingYears.map((year) => (
                      <option key={year} value={year}>
                        Añada {year} (Registrada)
                      </option>
                    ))}
                    {!existingYears.includes(vintage) && (
                      <option value={vintage}>Añada {vintage} (Nueva)</option>
                    )}
                  </select>
                ) : (
                  <input
                    id="wine-vintage"
                    type="number"
                    min={1970}
                    max={2030}
                    value={vintage}
                    onChange={(e) => setVintage(Number(e.target.value))}
                    className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
                  />
                )}
              </div>
            </div>

            {/* Ubicación de Estante y Cantidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="wine-location"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Ubicación en Cava
                </label>
                <input
                  id="wine-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. B2 · ESTANTE MEDIO"
                  className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="wine-units"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Cantidad de Botellas
                </label>
                <input
                  id="wine-units"
                  type="number"
                  min={1}
                  max={120}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
                />
              </div>
            </div>

            {/* Footer Submit */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isChecking || isSubmitting}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isChecking || isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar en Bóveda</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
