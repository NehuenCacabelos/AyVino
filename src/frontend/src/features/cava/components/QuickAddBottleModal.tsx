import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Wine,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useWineSearch } from '../../wines/hooks/useWineSearch';
import { getWineVintages } from '../../winery/api/wineApi';
import { imageUrl } from '../../../lib/image';
import WineBottleSilhouette from '../../wines/components/WineBottleSilhouette';
import WineCreateModal, {
  type WineCreationResult,
  type UserModeInitialValues,
} from '../../winery/components/WineCreateModal';
import AddToCellarForm, { type AddToCellarWineInfo } from './AddToCellarForm';
import type { WineListItemDto, WineVintageResponseDto, WineType } from '../../winery/types/wine';

export interface QuickAddBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCellarId?: number;
  onBottleAdded?: (result: { cellarId: number; cellarName: string }) => void;
  /** @deprecated mantenido para evitar romper referencias previas */
  onAddBottle?: (bottle: unknown) => void;
}

const WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto',
  White: 'Blanco',
  Rose: 'Rosado',
  Sparkling: 'Espumoso',
  Orange: 'Naranjo',
};

export default function QuickAddBottleModal({
  isOpen,
  onClose,
  defaultCellarId,
  onBottleAdded,
  onAddBottle,
}: QuickAddBottleModalProps) {
  // Pasos: 'search' -> 'select-vintage' -> 'add-form'
  const [step, setStep] = useState<'search' | 'select-vintage' | 'add-form'>('search');

  // Paso 1: Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const {
    results: searchResults,
    isSearching,
    error: searchError,
    refetch: retrySearch,
  } = useWineSearch(searchQuery, { limit: 8, debounceMs: 350 });

  // Vino y Cosecha seleccionados
  const [selectedWine, setSelectedWine] = useState<WineListItemDto | null>(null);
  const [vintages, setVintages] = useState<WineVintageResponseDto[]>([]);
  const [isLoadingVintages, setIsLoadingVintages] = useState(false);
  const [vintagesError, setVintagesError] = useState<string | null>(null);
  const [selectedVintage, setSelectedVintage] = useState<WineVintageResponseDto | null>(null);

  // Modal Crear Vino / Cosecha colaborativo
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialName, setCreateModalInitialName] = useState('');
  const [createModalInitialValues, setCreateModalInitialValues] = useState<UserModeInitialValues | undefined>(undefined);

  // Sincronizar apertura/cierre de modal durante el render
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSelectedWine(null);
      setSelectedVintage(null);
      setVintages([]);
      setVintagesError(null);
      setIsCreateModalOpen(false);
    }
  }

  // Cargar cosechas al pasar a paso 2
  useEffect(() => {
    if (!selectedWine || step !== 'select-vintage') return;
    let isMounted = true;

    getWineVintages(selectedWine.id)
      .then((data) => {
        if (!isMounted) return;
        // Ordenar por año descendente, "Sin añada" (null) al final
        const sorted = [...data].sort((a, b) => {
          if (a.year == null) return 1;
          if (b.year == null) return -1;
          return b.year - a.year;
        });
        setVintages(sorted);
        setIsLoadingVintages(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setVintagesError('No se pudieron cargar las cosechas de este vino.');
        setIsLoadingVintages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedWine, step]);

  if (!isOpen) return null;

  // Manejo de creación o adopción desde WineCreateModal (continuar directamente al paso 3)
  const handleWineCreatedOrAdopted = (result: WineCreationResult) => {
    setIsCreateModalOpen(false);
    const resolvedWine: WineListItemDto = selectedWine ?? {
      id: result.wine.id,
      name: result.wine.name,
      wineryId: null,
      wineryNameText: createModalInitialValues?.wineryName || 'Vino de la comunidad',
      wineType: (createModalInitialValues?.wineType as string) || 'Red',
      description: null,
      locationId: null,
      sourceType: 'Community',
      duplicateOfWineId: null,
      averageRating: null,
      reviewCount: 0,
      referenceVintageYear: null,
      thumbnailImageId: null,
    };

    setSelectedWine(resolvedWine);
    setSelectedVintage({
      id: result.vintageId,
      wineId: result.wine.id,
      year: null,
      alcoholContent: null,
      servingTemperature: null,
      agingAdvice: null,
      imageId: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 0,
      registerDate: new Date().toISOString(),
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    });
    setStep('add-form');
  };

  const handleFinishAdd = (result: {
    cellarId: number;
    cellarName: string;
    quantityAdded: number;
    totalQuantity: number;
  }) => {
    onBottleAdded?.({ cellarId: result.cellarId, cellarName: result.cellarName });
    onAddBottle?.(result);
    onClose();
  };

  const wineInfoForForm: AddToCellarWineInfo | null =
    selectedWine && selectedVintage
      ? {
          wineId: selectedWine.id,
          wineVintageId: selectedVintage.id,
          wineName: selectedWine.name,
          vintageYear: selectedVintage.year,
          wineryName: selectedWine.wineryNameText ?? undefined,
          wineType: selectedWine.wineType,
          approvalStatus: selectedVintage.approvalStatus,
        }
      : null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0e0e11]">
            <div className="flex items-center gap-2 min-w-0">
              {step !== 'search' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'add-form' ? 'select-vintage' : 'search')}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors mr-1 cursor-pointer"
                  aria-label="Volver al paso anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <Plus className="w-5 h-5 text-[#fbbf24] shrink-0" />
              <h3 className="font-serif text-lg sm:text-xl text-neutral-100 font-semibold truncate">
                {step === 'search' && 'Buscar Vino para la Cava'}
                {step === 'select-vintage' && 'Seleccionar Cosecha'}
                {step === 'add-form' && 'Guardar en mi Cava'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* PASO 1: BUSCADOR DE VINOS */}
            {step === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre de vino o bodega..."
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 rounded-xl pl-10 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Error de búsqueda */}
                {searchError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center justify-between">
                    <span>{searchError}</span>
                    <button
                      type="button"
                      onClick={retrySearch}
                      className="inline-flex items-center gap-1 underline text-white font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reintentar</span>
                    </button>
                  </div>
                )}

                {/* Estado de Carga */}
                {isSearching && (
                  <div className="p-8 text-center text-neutral-400 text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Buscando etiquetas en el catálogo...</p>
                  </div>
                )}

                {/* Lista de Resultados */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                      Resultados del catálogo:
                    </p>
                    {searchResults.map((wine) => {
                      const typeLabel = WINE_TYPE_LABELS[wine.wineType] || wine.wineType;
                      return (
                        <div
                          key={wine.id}
                          onClick={() => {
                            setSelectedWine(wine);
                            setIsLoadingVintages(true);
                            setVintagesError(null);
                            setStep('select-vintage');
                          }}
                          className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-stone-900 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                              {wine.thumbnailImageId ? (
                                <img
                                  src={imageUrl(wine.thumbnailImageId, 'bottle') || ''}
                                  alt={wine.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="scale-75">
                                  <WineBottleSilhouette className="w-6 h-10" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-neutral-200 group-hover:text-white truncate">
                                {wine.name}
                              </h4>
                              <p className="text-xs text-neutral-400 truncate">
                                {wine.wineryNameText || 'Sin bodega'} · {typeLabel}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-neutral-400 shrink-0">
                            {wine.referenceVintageYear ?? 'NV'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Estado Vacío: Sin Resultados -> Opción Crear Vino */}
                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
                    <Wine className="w-8 h-8 text-neutral-500 mx-auto" />
                    <p className="text-xs text-neutral-300">
                      No encontramos «{searchQuery.trim()}»
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateModalInitialName(searchQuery.trim());
                        setCreateModalInitialValues(undefined);
                        setIsCreateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#722F37] hover:bg-[#85222e] text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar vino</span>
                    </button>
                  </div>
                )}

                {/* Ayuda inicial */}
                {searchQuery.trim().length < 2 && (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    Escribí al menos 2 caracteres para buscar entre las etiquetas disponibles del catálogo.
                  </p>
                )}
              </div>
            )}

            {/* PASO 2: ELEGIR COSECHA */}
            {step === 'select-vintage' && selectedWine && (
              <div className="space-y-4">
                {/* Cabecera del vino seleccionado */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-100 truncate">
                      {selectedWine.name}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate">
                      {selectedWine.wineryNameText || 'Sin bodega'} · {WINE_TYPE_LABELS[selectedWine.wineType] || selectedWine.wineType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('search')}
                    className="text-xs text-[#fbbf24] hover:underline font-medium shrink-0 cursor-pointer"
                  >
                    Cambiar vino
                  </button>
                </div>

                {/* Error de cosechas */}
                {vintagesError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center justify-between">
                    <span>{vintagesError}</span>
                  </div>
                )}

                {/* Carga de cosechas */}
                {isLoadingVintages && (
                  <div className="p-8 text-center text-neutral-400 text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Cargando cosechas...</p>
                  </div>
                )}

                {/* Lista de cosechas */}
                {!isLoadingVintages && vintages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-300">
                      Seleccioná la añada a ingresar:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {vintages.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVintage(v);
                            setStep('add-form');
                          }}
                          className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-500/50 text-left transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold text-neutral-100 group-hover:text-white">
                              {v.year ?? 'Sin añada'}
                            </span>
                            {v.approvalStatus === 'Pending' && (
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                Sin verificar
                              </span>
                            )}
                          </div>
                          {v.alcoholContent && (
                            <span className="text-[11px] text-neutral-400 mt-1 block">
                              {v.alcoholContent}% alc.
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin cosechas visibles -> Opción agregar cosecha */}
                {!isLoadingVintages && vintages.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-neutral-300">
                      Este vino no tiene cosechas visibles disponibles.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateModalInitialName(selectedWine.name);
                        setCreateModalInitialValues({
                          name: selectedWine.name,
                          wineryName: selectedWine.wineryNameText ?? '',
                          wineType: (selectedWine.wineType as WineType) || '',
                        });
                        setIsCreateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#722F37] hover:bg-[#85222e] text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar una cosecha</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PASO 3: FORMULARIO AGREGAR A CAVA */}
            {step === 'add-form' && wineInfoForForm && (
              <AddToCellarForm
                wine={wineInfoForForm}
                defaultCellarId={defaultCellarId}
                onDone={handleFinishAdd}
                onCancel={() => setStep('select-vintage')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal para Crear Vino o Cosecha si no existe */}
      {isCreateModalOpen && (
        <WineCreateModal
          mode="user"
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialName={createModalInitialName}
          initialValues={createModalInitialValues}
          onResolved={handleWineCreatedOrAdopted}
          onResolvedBehavior="delegate"
        />
      )}
    </>
  );
}
