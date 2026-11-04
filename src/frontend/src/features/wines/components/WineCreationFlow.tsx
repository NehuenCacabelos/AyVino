import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Wine,
  CheckCircle2,
  ExternalLink,
  History,
  Plus,
  GlassWater,
  Sparkles,
} from 'lucide-react';
import WineCreateModal, {
  type WineCreationResult,
  type UserModeInitialValues,
} from '../../winery/components/WineCreateModal';
import UncorkDialog from '../../dashboard/components/UncorkDialog';
import AddToCellarForm from '../../cava/components/AddToCellarForm';
import WineBottleSilhouette from './WineBottleSilhouette';
import { imageUrl } from '../../../lib/image';
import { getCellarsApi, createCellarApi, addCellarItemApi } from '../../cava/api/cellarApi';
import { decidePostWineCreationAction, type WineNextActionDecision } from '../utils/creationFlowUtils';

export type { WineNextActionDecision };
export type FlowStep = 'creating' | 'choosing' | 'uncorking' | 'cellar' | 'closing' | 'dismissed';

interface LastActionInfo {
  type: 'uncorked' | 'cellar';
  cellarId?: number;
  cellarName?: string;
  quantityAdded?: number;
}

export interface WineCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialValues?: UserModeInitialValues;
  onWineCreated?: (result: WineCreationResult) => void;
}

interface ToastNotice {
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function WineCreationFlow({
  isOpen,
  onClose,
  initialName,
  initialValues,
  onWineCreated,
}: WineCreationFlowProps) {
  const [step, setStep] = useState<FlowStep>('creating');
  const [creationResult, setCreationResult] = useState<WineCreationResult | null>(null);
  const [lastAction, setLastAction] = useState<LastActionInfo | null>(null);
  const [toastNotice, setToastNotice] = useState<ToastNotice | null>(null);

  // Ajuste de estado cuando cambia la prop isOpen (patrón oficial de React para sincronizar props)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('creating');
      setCreationResult(null);
      setLastAction(null);
    }
  }

  // Temporizador para auto-ocultar el toast de "Ahora no"
  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => {
      setToastNotice(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  // Manejador del paso "Ahora no"
  const handleAhoraNo = useCallback(() => {
    if (!creationResult) {
      onClose();
      return;
    }

    if (creationResult.outcome === 'created' || creationResult.outcome === 'vintage-added') {
      setToastNotice({
        message: `Cargaste «${creationResult.wine.name}»`,
        actionLabel: 'Ver ficha',
        actionTo: `/vinos/${creationResult.wine.id}`,
      });
    } else {
      // outcome === 'adopted': no muestra enlace a la ficha porque aún no participa
      setToastNotice({
        message: `Usamos «${creationResult.wine.name}», que ya estaba cargado`,
      });
    }

    setStep('dismissed');
    onClose();
  }, [creationResult, onClose]);

  // Manejo de teclado (Escape) en los pasos modales del flujo
  useEffect(() => {
    if (!isOpen || step === 'creating' || step === 'dismissed') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'choosing') {
          handleAhoraNo();
        } else if (step === 'cellar') {
          setStep('choosing');
        } else if (step === 'closing') {
          onClose();
          setStep('dismissed');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleAhoraNo, onClose]);

  const handleRestartFlow = () => {
    setStep('creating');
    setCreationResult(null);
    setLastAction(null);
  };

  const handleCloseFlow = () => {
    onClose();
    setStep('dismissed');
  };

  if (!isOpen && !toastNotice) {
    return null;
  }

  return (
    <>
      {/* 1. PASO CREAR: WineCreateModal en modo usuario con comportamiento delegado */}
      {isOpen && step === 'creating' && (
        <WineCreateModal
          mode="user"
          isOpen={true}
          onClose={onClose}
          initialName={initialName}
          initialValues={initialValues}
          onResolvedBehavior="delegate"
          onResolved={async (result) => {
            setCreationResult(result);
            onWineCreated?.(result);

            const decision = await decidePostWineCreationAction(getCellarsApi);
            if (decision === 'auto-add') {
              try {
                const newCellar = await createCellarApi({ name: 'Mi cava' });
                await addCellarItemApi(newCellar.id, {
                  wineVintageId: result.vintageId,
                  quantity: 1,
                });
                setLastAction({
                  type: 'cellar',
                  cellarId: newCellar.id,
                  cellarName: newCellar.name,
                  quantityAdded: 1,
                });
                setStep('closing');
                return;
              } catch {
                setStep('choosing');
                return;
              }
            }

            setStep('choosing');
          }}
        />
      )}

      {/* 2. PASO ELEGIR: ¿Lo vas a tomar o lo agregás a tu cava? */}
      {isOpen && step === 'choosing' && creationResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="choosing-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-[#121015] border border-white/10 rounded-3xl p-6 shadow-2xl text-neutral-200 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-rose-400 block mb-1">
                  Acción Posterior
                </span>
                <h2 id="choosing-title" className="font-serif text-xl font-bold text-zinc-100">
                  ¿Qué querés hacer con este vino?
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAhoraNo}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tarjeta chica de vista previa del vino */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0c0c0e] border border-white/5">
              <div className="w-14 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                {creationResult.personalImageId ? (
                  <img
                    src={imageUrl(creationResult.personalImageId, 'bottle')!}
                    alt={creationResult.wine.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-12 flex items-center justify-center text-neutral-600">
                    <WineBottleSilhouette className="w-6 h-10" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium text-zinc-100 text-sm truncate">
                  {creationResult.wine.name}
                </h3>
                <p className="text-xs text-neutral-400 truncate">
                  {creationResult.winery || 'Bodega no especificada'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300">
                    {creationResult.year != null ? creationResult.year : 'Sin añada'}
                  </span>
                  {creationResult.wineType && (
                    <span className="text-[11px] text-neutral-500 font-sans">
                      {creationResult.wineType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso si el vino fue adoptado */}
            {creationResult.outcome === 'adopted' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Este vino ya estaba cargado.</span>
              </div>
            )}

            {/* Tres opciones: Agregar a una cava, Descorchar ahora, y Solo guardarlo / Ahora no */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('cellar')}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wine className="w-4 h-4 text-rose-400" />
                <span>Agregar a una cava</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('uncorking')}
                className="w-full py-3 px-4 rounded-xl bg-[#6b1d28] hover:bg-[#832232] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-rose-950/40"
              >
                <GlassWater className="w-4 h-4" />
                <span>Descorchar ahora</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleAhoraNo}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer py-1 px-3"
                >
                  Solo guardarlo / Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PASO DESCORCHAR: UncorkDialog en modo directo (sin cellarId) */}
      {isOpen && step === 'uncorking' && creationResult && (
        <UncorkDialog
          wine={{
            wineId: creationResult.wine.id,
            wineVintageId: creationResult.vintageId,
            name: creationResult.wine.name,
            winery: creationResult.winery,
            year: creationResult.year,
            wineType: creationResult.wineType,
            imageUrl: creationResult.personalImageId
              ? imageUrl(creationResult.personalImageId, 'bottle') ?? undefined
              : undefined,
          }}
          onClose={() => setStep('choosing')}
          onDone={() => {
            setLastAction({ type: 'uncorked' });
            setStep('closing');
          }}
        />
      )}

      {/* 4. PASO CAVA: AddToCellarForm con la cosecha ya elegida */}
      {isOpen && step === 'cellar' && creationResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cellar-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-xl bg-[#121015] border border-white/10 rounded-3xl p-6 shadow-2xl text-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-rose-400 block mb-1">
                  Guardar en Cava
                </span>
                <h2 id="cellar-title" className="font-serif text-xl font-bold text-neutral-100">
                  Agregar a mi cava
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep('choosing')}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Volver al paso de elección"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AddToCellarForm
              wine={{
                wineId: creationResult.wine.id,
                wineVintageId: creationResult.vintageId,
                wineName: creationResult.wine.name,
                vintageYear: creationResult.year,
                wineryName: creationResult.winery,
                wineType: creationResult.wineType,
              }}
              onDone={(res) => {
                setLastAction({
                  type: 'cellar',
                  cellarId: res.cellarId,
                  cellarName: res.cellarName,
                  quantityAdded: res.quantityAdded,
                });
                setStep('closing');
              }}
              onCancel={() => setStep('choosing')}
            />
          </div>
        </div>
      )}

      {/* 6. PASO CIERRE: Mensaje de confirmación y enlaces contextuales */}
      {isOpen && step === 'closing' && creationResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="closing-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-[#121015] border border-white/10 rounded-3xl p-6 shadow-2xl text-neutral-200 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 id="closing-title" className="font-serif text-2xl font-bold text-neutral-100">
                {lastAction?.type === 'uncorked' ? '¡Descorche registrado!' : '¡Agregado a tu cava!'}
              </h2>
              <p className="text-sm text-neutral-300 font-sans leading-relaxed">
                {lastAction?.type === 'uncorked'
                  ? `Registraste el descorche de «${creationResult.wine.name}».`
                  : `Se agregaron ${lastAction?.quantityAdded ?? 1} botella(s) de «${creationResult.wine.name}» a ${lastAction?.cellarName || 'tu cava'}.`}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                to={`/vinos/${creationResult.wine.id}`}
                onClick={handleCloseFlow}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-neutral-400" />
                <span>Ver ficha</span>
              </Link>

              {lastAction?.type === 'uncorked' && (
                <Link
                  to="/perfil?tab=historial"
                  onClick={handleCloseFlow}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#6b1d28] hover:bg-[#832232] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <History className="w-4 h-4" />
                  <span>Ver mi historial</span>
                </Link>
              )}

              {lastAction?.type === 'cellar' && (
                <>
                  <Link
                    to={`/cava?cava=${lastAction.cellarId}`}
                    onClick={handleCloseFlow}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#6b1d28] hover:bg-[#832232] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Wine className="w-4 h-4" />
                    <span>Ver mi cava</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setStep('uncorking')}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <GlassWater className="w-4 h-4 text-rose-400" />
                    <span>Descorchar ahora</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleRestartFlow}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cargar otro</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={handleCloseFlow}
                className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AVISO FLOTANTE DE "AHORA NO" */}
      {toastNotice && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#141216]/95 border border-white/10 shadow-2xl backdrop-blur-md text-sm text-white animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{toastNotice.message}</span>
          {toastNotice.actionLabel && toastNotice.actionTo && (
            <Link
              to={toastNotice.actionTo}
              onClick={() => setToastNotice(null)}
              className="font-medium text-rose-300 hover:text-rose-200 underline underline-offset-4 ml-1"
            >
              {toastNotice.actionLabel} &rarr;
            </Link>
          )}
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="ml-2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
