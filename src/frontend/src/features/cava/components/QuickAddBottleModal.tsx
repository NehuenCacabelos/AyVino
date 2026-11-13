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
  Upload,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import type { BottleKind, DashboardWine } from '../../../types/wine';
import type { QuickAddBottlePayload } from '../types';
import type { GrapeResponseDto } from '../../winery/types';
import { fetchGrapesCatalogOnce, sortGrapesForWineType } from '../api/grapesCatalogCache';
import { resizeImageToMax } from '../utils/imageResize';

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

interface WinerySuggestItem {
  id: number;
  name: string;
}

interface CellarItemQuickAddResponse {
  wineVintageId: number;
  wineId: number;
  name: string;
  wineType: string;
  year?: number | null;
  quantity: number;
}

const WINE_TYPES: Array<{ value: string; label: string; defaultBottle: BottleKind }> = [
  { value: 'Red', label: 'Tinto', defaultBottle: 'red-burgundy' },
  { value: 'White', label: 'Blanco', defaultBottle: 'white' },
  { value: 'Rose', label: 'Rosado', defaultBottle: 'red-burgundy' },
  { value: 'Sparkling', label: 'Espumoso', defaultBottle: 'sparkling' },
  { value: 'Orange', label: 'Naranjo', defaultBottle: 'white' },
];

export interface QuickAddBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBottle?: (bottle: QuickAddBottlePayload) => Promise<void> | void;
  initialName?: string;
  initialWine?: DashboardWine | null;
  showToast?: (message: string) => void;
}

export default function QuickAddBottleModal({
  isOpen,
  onClose,
  onAddBottle,
  initialName,
  initialWine,
  showToast,
}: QuickAddBottleModalProps) {
  const navigate = useNavigate();

  const [name, setName] = useState(initialWine?.name || initialName || '');
  const [winery, setWinery] = useState(initialWine?.winery || '');
  const [region, setRegion] = useState(initialWine?.region || 'Mendoza, Argentina');
  const [selectedWineType, setSelectedWineType] = useState<string>('Red');
  const [selectedGrapeId, setSelectedGrapeId] = useState<number | null>(1);
  const [selectedGrapeName, setSelectedGrapeName] = useState<string>(initialWine?.varietal || 'Malbec');
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
      setSelectedGrapeName(initialWine.varietal || '');
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

  // Sugerencias de búsqueda en vivo de etiquetas (máximo 5)
  const [suggestions, setSuggestions] = useState<CatalogSearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSugIndex, setActiveSugIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Sugerencias de bodegas en vivo (máximo 5)
  const [winerySuggestions, setWinerySuggestions] = useState<WinerySuggestItem[]>([]);
  const [showWinerySuggestions, setShowWinerySuggestions] = useState(false);
  const [activeWinerySugIndex, setActiveWinerySugIndex] = useState(-1);
  const [isSearchingWineries, setIsSearchingWineries] = useState(false);

  // Catálogo de uvas maestro
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);
  const [showGrapeDropdown, setShowGrapeDropdown] = useState(false);
  const [grapeSearchQuery, setGrapeSearchQuery] = useState('');
  const [activeGrapeIndex, setActiveGrapeIndex] = useState(-1);

  // Añadas existentes de la etiqueta seleccionada
  const [existingYears, setExistingYears] = useState<number[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  // Imagen opcional
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isResizingImage, setIsResizingImage] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [matchedCandidate, setMatchedCandidate] = useState<MatchedWineData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const wineryContainerRef = useRef<HTMLDivElement>(null);
  const grapeContainerRef = useRef<HTMLDivElement>(null);

  // Cargar catálogo de uvas exactamente una vez por sesión
  useEffect(() => {
    if (!isOpen) return;
    fetchGrapesCatalogOnce().then((list) => {
      setGrapesCatalog(list);
    });
  }, [isOpen]);

  // Lista de uvas ordenadas por color del tipo seleccionado
  const sortedGrapes = useMemo(() => {
    return sortGrapesForWineType(grapesCatalog, selectedWineType);
  }, [grapesCatalog, selectedWineType]);

  // Uvas filtradas según búsqueda
  const filteredGrapes = useMemo(() => {
    if (!grapeSearchQuery.trim()) return sortedGrapes;
    const q = grapeSearchQuery.toLowerCase();
    return sortedGrapes.filter((g) => g.name.toLowerCase().includes(q));
  }, [sortedGrapes, grapeSearchQuery]);

  // Obligatoriedad de uva principal
  const isGrapeRequired = selectedWineType === 'Red' || selectedWineType === 'White';

  // Carga reactiva de sugerencias de etiquetas (debounce 250 ms)
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
        .catch(() => {})
        .finally(() => {
          setIsSearchingSuggestions(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, isLocked, isOpen]);

  // Carga reactiva de sugerencias de bodegas registradas (debounce 250 ms)
  useEffect(() => {
    if (isLocked || !isOpen || winery.trim().length < 2) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setIsSearchingWineries(true);
      apiClient
        .get<WinerySuggestItem[]>('/wineries/suggest', {
          params: { q: winery.trim() },
          signal: controller.signal,
        })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data.slice(0, 5) : [];
          setWinerySuggestions(list);
          setShowWinerySuggestions(list.length > 0);
          setActiveWinerySugIndex(-1);
        })
        .catch(() => {})
        .finally(() => {
          setIsSearchingWineries(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [winery, isLocked, isOpen]);

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
      .catch(() => {})
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
    setSelectedWineType('Red');
    setSelectedGrapeId(null);
    setSelectedGrapeName('');
    setGrapeSearchQuery('');
    setVintage(new Date().getFullYear() - 3);
    setLocation('A1 · ESTANTE SUP.');
    setUnits(1);
    setBottleKind('red-burgundy');
    setMatchedWineId(null);
    setIsLocked(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setWinerySuggestions([]);
    setShowWinerySuggestions(false);
    setShowGrapeDropdown(false);
    setExistingYears([]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageBlob(null);
    setMatchedCandidate(null);
    setErrorMessage(null);
    setIsChecking(false);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    onClose();
  };

  const handleSelectSuggestion = (item: CatalogSearchItem) => {
    setName(item.name);
    setWinery(item.wineryName || item.wineryNameText || '');
    setRegion(item.regionName || item.stateName || 'Mendoza, Argentina');

    if (item.wineType) {
      const match = WINE_TYPES.find(
        (t) => t.value.toLowerCase() === item.wineType?.toLowerCase(),
      );
      if (match) {
        setSelectedWineType(match.value);
        setBottleKind(match.defaultBottle);
      }
    }

    if (item.grapeName) {
      setSelectedGrapeName(item.grapeName);
      const matchedGrape = grapesCatalog.find(
        (g) => g.name.toLowerCase() === item.grapeName?.toLowerCase(),
      );
      if (matchedGrape) {
        setSelectedGrapeId(matchedGrape.id);
      }
    }

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
    setSelectedGrapeId(null);
    setSelectedGrapeName('');
    setVintage(new Date().getFullYear() - 3);
    setBottleKind('red-burgundy');
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageBlob(null);
  };

  const handleSelectWinery = (wineryItem: WinerySuggestItem) => {
    setWinery(wineryItem.name);
    setWinerySuggestions([]);
    setShowWinerySuggestions(false);
  };

  const handleSelectGrape = (grape: GrapeResponseDto) => {
    setSelectedGrapeId(grape.id);
    setSelectedGrapeName(grape.name);
    setGrapeSearchQuery('');
    setShowGrapeDropdown(false);
  };

  const handleClearGrape = () => {
    setSelectedGrapeId(null);
    setSelectedGrapeName('');
    setGrapeSearchQuery('');
  };

  const handleTypeChange = (newType: string) => {
    setSelectedWineType(newType);
    const typeMeta = WINE_TYPES.find((t) => t.value === newType);
    if (typeMeta) {
      setBottleKind(typeMeta.defaultBottle);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor seleccioná un archivo de imagen válido (JPEG, PNG o WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen no debe superar los 5 MB.');
      return;
    }

    setErrorMessage(null);
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);

    setIsResizingImage(true);
    try {
      const resized = await resizeImageToMax(file, 1200);
      setImageBlob(resized);
    } catch {
      setImageBlob(file);
    } finally {
      setIsResizingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageBlob(null);
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

  const handleKeyDownWinery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showWinerySuggestions || winerySuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveWinerySugIndex((prev) => (prev < winerySuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveWinerySugIndex((prev) => (prev > 0 ? prev - 1 : winerySuggestions.length - 1));
    } else if (e.key === 'Enter' && activeWinerySugIndex >= 0) {
      e.preventDefault();
      handleSelectWinery(winerySuggestions[activeWinerySugIndex]);
    } else if (e.key === 'Escape') {
      setShowWinerySuggestions(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si ya está bloqueado con un vino existente, guardar directamente
    if (isLocked && matchedWineId) {
      await executeSave(matchedWineId);
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Por favor completá el nombre de la etiqueta.');
      return;
    }

    if (!winery.trim()) {
      setErrorMessage('Por favor indicá la bodega productora.');
      return;
    }

    if (isGrapeRequired && !selectedGrapeId) {
      setErrorMessage('La uva principal es obligatoria para vinos tintos y blancos.');
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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: name.trim(),
        wineryName: winery.trim(),
        wineType: selectedWineType,
        year: Number(vintage) || 2021,
        quantity: Math.max(1, Number(units) || 1),
        location: location.trim(),
        notes: location.trim(),
        matchedWineId: matchedWineIdToSave,
        mainGrapeId: selectedGrapeId ?? null,
      };

      const res = await apiClient.post<CellarItemQuickAddResponse>(
        '/cellars/me/quick-add',
        payload,
      );
      const createdItem = res?.data;

      // Subida de imagen opcional en segunda llamada
      let imageUploadFailed = false;
      const fileToUpload = imageBlob || imageFile;
      if (fileToUpload && createdItem?.wineId && createdItem?.wineVintageId) {
        try {
          const formData = new FormData();
          formData.append('file', fileToUpload, imageFile?.name || 'etiqueta.jpg');
          await apiClient.put(
            `/wines/${createdItem.wineId}/vintages/${createdItem.wineVintageId}/image`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        } catch {
          imageUploadFailed = true;
        }
      }

      // Notificar callback externo
      if (onAddBottle) {
        await onAddBottle({
          name: name.trim(),
          winery: winery.trim(),
          region: region.trim(),
          varietal: selectedGrapeName || 'Varietal',
          vintage: Number(vintage) || 2021,
          location: location.trim(),
          units: Math.max(1, Number(units) || 1),
          isJewel: false,
          bottle: bottleKind,
          matchedWineId: matchedWineIdToSave,
          wineType: selectedWineType,
          mainGrapeId: selectedGrapeId ?? null,
          imageFile,
        });
      }

      // Notificaciones / Toasts
      if (imageUploadFailed) {
        showToast?.(
          'Tu vino quedó cargado en tu cava y será revisado por AyVino, pero la imagen no pudo subirse.',
        );
      } else if (!matchedWineIdToSave) {
        showToast?.('Tu vino quedó cargado en tu cava y será revisado por AyVino.');
      } else {
        showToast?.(`"${name.trim()}" fue agregado con éxito a tu Cava.`);
      }

      handleResetAndClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string; message?: string } }; message?: string };
      if (axiosErr?.response?.status === 409) {
        const detail =
          axiosErr.response.data?.detail ||
          axiosErr.response.data?.message ||
          'Ya existe una etiqueta idéntica registrada en el catálogo.';
        setErrorMessage(detail);
        showToast?.(detail);
      } else {
        const msg =
          axiosErr?.response?.data?.detail ||
          axiosErr?.response?.data?.message ||
          axiosErr?.message ||
          'Error al guardar la botella en la cava.';
        setErrorMessage(msg);
        showToast?.(msg);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0e0e11] shrink-0">
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
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalog Shortcut Banner (Solo cuando no está bloqueado ni en verificación) */}
        {!matchedCandidate && !isLocked && (
          <div className="bg-[#18181f] border-b border-neutral-800/80 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
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
              className="text-xs font-semibold text-[#fbbf24] hover:text-[#fde68a] hover:underline whitespace-nowrap transition-colors cursor-pointer"
            >
              Explorar en Catálogo &rarr;
            </button>
          </div>
        )}

        {/* Banner de Vino Seleccionado / Bloqueado */}
        {isLocked && !matchedCandidate && (
          <div className="bg-amber-950/30 border-b border-amber-800/40 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
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
          <div className="mx-5 mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs shrink-0">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  No, crear como nuevo vino
                </button>
                <button
                  type="button"
                  onClick={() => executeSave(matchedCandidate.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all disabled:opacity-50 cursor-pointer"
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

                  {/* Opción de Crear Nuevo Vino si no coincide con ninguna sugerencia */}
                  <li
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSuggestions([]);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false);
                        setSuggestions([]);
                      }
                    }}
                    className="p-3 bg-neutral-900/90 hover:bg-neutral-800 text-xs text-amber-300 font-semibold cursor-pointer flex items-center justify-between border-t border-neutral-700/60"
                  >
                    <span>¿No encontrás tu etiqueta? Creá «{name}» como vino nuevo</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">
                      Continuar
                    </span>
                  </li>
                </ul>
              )}
            </div>

            {/* Bodega (Sugerencias 250ms o Texto Libre) y Región */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div ref={wineryContainerRef} className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="wine-winery"
                    className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                  >
                    Bodega Productora *
                  </label>
                  {isSearchingWineries && (
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-[#fbbf24]" />
                      <span>Buscando...</span>
                    </span>
                  )}
                </div>

                <input
                  id="wine-winery"
                  type="text"
                  required
                  disabled={isLocked}
                  value={winery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWinery(val);
                    if (val.trim().length < 2) {
                      setWinerySuggestions([]);
                      setShowWinerySuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    if (!isLocked && winerySuggestions.length > 0) {
                      setShowWinerySuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDownWinery}
                  placeholder="Ej. Catena Zapata (o texto libre)"
                  role="combobox"
                  aria-expanded={showWinerySuggestions}
                  aria-autocomplete="list"
                  aria-controls="quickadd-winery-suggestions"
                  aria-activedescendant={
                    activeWinerySugIndex >= 0 ? `quickadd-winery-sug-${activeWinerySugIndex}` : undefined
                  }
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLocked
                      ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:border-[#722F37]'
                  }`}
                />

                {/* Desplegable de Bodegas Registradas */}
                {showWinerySuggestions && winerySuggestions.length > 0 && !isLocked && (
                  <ul
                    role="listbox"
                    id="quickadd-winery-suggestions"
                    aria-label="Sugerencias de bodegas registradas"
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-white/[0.12] bg-[#141417]/95 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/[0.06]"
                  >
                    {winerySuggestions.map((sug, idx) => (
                      <li
                        key={sug.id}
                        role="option"
                        id={`quickadd-winery-sug-${idx}`}
                        aria-selected={idx === activeWinerySugIndex}
                        onClick={() => handleSelectWinery(sug)}
                        onMouseEnter={() => setActiveWinerySugIndex(idx)}
                        className={`p-2.5 cursor-pointer text-left transition-colors flex items-center justify-between text-xs ${
                          idx === activeWinerySugIndex ? 'bg-white/[0.08] text-white' : 'text-neutral-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="font-medium truncate">{sug.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                          Registrada
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
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

            {/* Tipo de Vino y Uva Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Selector de Tipo (Tinto, Blanco, Rosado, Espumoso, Naranjo) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="wine-type"
                  className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                >
                  Tipo *
                </label>
                <select
                  id="wine-type"
                  disabled={isLocked}
                  value={selectedWineType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLocked
                      ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 focus:border-[#722F37]'
                  }`}
                >
                  {WINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#0a0a0c] text-neutral-100">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Uva Principal con Buscador */}
              <div ref={grapeContainerRef} className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="wine-main-grape"
                    className="font-mono text-xs text-neutral-300 uppercase tracking-wide block"
                  >
                    Uva Principal {isGrapeRequired && '*'}
                  </label>
                  {selectedGrapeId && (
                    <button
                      type="button"
                      onClick={handleClearGrape}
                      className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="wine-main-grape"
                    type="text"
                    disabled={isLocked}
                    value={
                      showGrapeDropdown
                        ? grapeSearchQuery
                        : selectedGrapeName || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setGrapeSearchQuery(val);
                      if (val.trim() === '') {
                        setSelectedGrapeId(null);
                        setSelectedGrapeName('');
                      }
                      setShowGrapeDropdown(true);
                    }}
                    onFocus={() => {
                      if (!isLocked) setShowGrapeDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (!showGrapeDropdown || filteredGrapes.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveGrapeIndex((prev) =>
                          prev < filteredGrapes.length - 1 ? prev + 1 : 0,
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveGrapeIndex((prev) =>
                          prev > 0 ? prev - 1 : filteredGrapes.length - 1,
                        );
                      } else if (e.key === 'Enter' && activeGrapeIndex >= 0) {
                        e.preventDefault();
                        handleSelectGrape(filteredGrapes[activeGrapeIndex]);
                      } else if (e.key === 'Escape') {
                        setShowGrapeDropdown(false);
                      }
                    }}
                    placeholder={
                      isGrapeRequired
                        ? 'Buscar uva (ej. Malbec)... *'
                        : 'Buscar uva (opcional)...'
                    }
                    role="combobox"
                    aria-expanded={showGrapeDropdown}
                    aria-autocomplete="list"
                    aria-controls="quickadd-grape-listbox"
                    aria-activedescendant={
                      activeGrapeIndex >= 0 ? `quickadd-grape-opt-${activeGrapeIndex}` : undefined
                    }
                    className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none pr-8 ${
                      isLocked
                        ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'bg-[#0a0a0c] border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:border-[#722F37]'
                    }`}
                  />
                  <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* Dropdown de Uvas */}
                {showGrapeDropdown && !isLocked && (
                  <ul
                    role="listbox"
                    id="quickadd-grape-listbox"
                    aria-label="Catálogo de uvas"
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-white/[0.12] bg-[#141417]/95 backdrop-blur-xl shadow-2xl divide-y divide-white/[0.06]"
                  >
                    {filteredGrapes.length === 0 ? (
                      <li className="p-3 text-xs text-neutral-400 text-center">
                        No se encontraron uvas con ese nombre
                      </li>
                    ) : (
                      filteredGrapes.map((grape, idx) => (
                        <li
                          key={grape.id}
                          role="option"
                          id={`quickadd-grape-opt-${idx}`}
                          aria-selected={idx === activeGrapeIndex || selectedGrapeId === grape.id}
                          onClick={() => handleSelectGrape(grape)}
                          onMouseEnter={() => setActiveGrapeIndex(idx)}
                          className={`p-2.5 cursor-pointer text-left transition-colors flex items-center justify-between text-xs ${
                            idx === activeGrapeIndex || selectedGrapeId === grape.id
                              ? 'bg-white/[0.08] text-white'
                              : 'text-neutral-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="font-medium">{grape.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-1.5 py-0.5 rounded capitalize">
                            {grape.colorType}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Añada y Cantidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Ubicación de Estante */}
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

            {/* Imagen Opcional de la Etiqueta (Con vista previa y compresión a máx 1200px) */}
            {!isLocked && (
              <div className="space-y-1.5 pt-1">
                <span className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                  Imagen de la Etiqueta (Opcional)
                </span>

                {imagePreviewUrl ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-800 bg-[#16161a]">
                    <img
                      src={imagePreviewUrl}
                      alt="Vista previa de la etiqueta"
                      className="w-14 h-14 object-cover rounded-lg border border-neutral-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-neutral-200 truncate">
                        {imageFile?.name || 'etiqueta.jpg'}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {isResizingImage
                          ? 'Optimizando imagen...'
                          : `${Math.round((imageBlob?.size || imageFile?.size || 0) / 1024)} KB · Optimizada`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Eliminar imagen"
                      aria-label="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="wine-image-file"
                    className="flex flex-col items-center justify-center border border-dashed border-neutral-800 hover:border-neutral-700 bg-[#0e0e12]/60 hover:bg-[#141418] rounded-xl p-4 cursor-pointer transition-colors group"
                  >
                    <input
                      id="wine-image-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 text-neutral-400 group-hover:text-neutral-200 text-xs">
                      <Upload className="w-4 h-4 text-[#fbbf24]" />
                      <span>Subir foto de la etiqueta (JPEG, PNG o WebP)</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono mt-1">
                      Máx. 5 MB · Se redimensiona automáticamente a 1.200 px
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Footer Submit */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isChecking || isSubmitting}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isChecking || isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all disabled:opacity-50 cursor-pointer"
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
