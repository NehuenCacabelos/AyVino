import { useState, useEffect, type FormEvent } from 'react';
import { Wine, AlertTriangle, CheckCircle2, ChevronDown, Calendar, FileText, Hash } from 'lucide-react';
import {
  getCellarsApi,
  createCellarApi,
  getCellarItemApi,
  addCellarItemApi,
  updateCellarItemApi,
  extractCellarErrorMessage,
} from '../api/cellarApi';
import type { CellarDto, CellarItemDto } from '../../users/types';

export interface AddToCellarWineInfo {
  wineId: number;
  wineVintageId: number;
  wineName: string;
  vintageYear: number | null;
  wineryName?: string;
  wineType?: string;
  approvalStatus?: string;
}

export interface AddToCellarFormProps {
  wine: AddToCellarWineInfo;
  defaultCellarId?: number;
  onDone: (result: {
    cellarId: number;
    cellarName: string;
    quantityAdded: number;
    totalQuantity: number;
  }) => void;
  onCancel?: () => void;
}

export default function AddToCellarForm({
  wine,
  defaultCellarId,
  onDone,
  onCancel,
}: AddToCellarFormProps) {
  const [cellars, setCellars] = useState<CellarDto[]>([]);
  const [isLoadingCellars, setIsLoadingCellars] = useState(true);
  const [cellarsError, setCellarsError] = useState<string | null>(null);

  const [selectedCellarId, setSelectedCellarId] = useState<number | null>(defaultCellarId ?? null);
  const [createdCellarId, setCreatedCellarId] = useState<number | null>(null);
  const [createdCellarName, setCreatedCellarName] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    cellarId: number;
  } | null>(null);

  // Cargar cavas del usuario al montar
  useEffect(() => {
    let isMounted = true;

    getCellarsApi()
      .then((data) => {
        if (!isMounted) return;
        setCellars(data);
        if (data.length > 0) {
          if (defaultCellarId && data.some((c) => c.id === defaultCellarId)) {
            setSelectedCellarId(defaultCellarId);
          } else {
            setSelectedCellarId(data[0].id);
          }
        }
        setIsLoadingCellars(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setCellarsError(extractCellarErrorMessage(err, 'No se pudieron cargar tus cavas.'));
        setIsLoadingCellars(false);
      });

    return () => {
      isMounted = false;
    };
  }, [defaultCellarId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (quantity < 1 || quantity > 999) {
      setSubmitError('La cantidad debe ser un número entero entre 1 y 999.');
      return;
    }

    if (notes.length > 500) {
      setSubmitError('Las notas no pueden superar los 500 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let targetCellarId: number;
      let targetCellarName: string;

      // a) Si no tiene cavas: crear "Mi cava" (o reutilizar la creada previamente si falló el agregado)
      if (cellars.length === 0) {
        if (createdCellarId && createdCellarName) {
          targetCellarId = createdCellarId;
          targetCellarName = createdCellarName;
        } else {
          const newCellar = await createCellarApi({ name: 'Mi cava' });
          targetCellarId = newCellar.id;
          targetCellarName = newCellar.name;
          setCreatedCellarId(newCellar.id);
          setCreatedCellarName(newCellar.name);
          setCellars([newCellar]);
          setSelectedCellarId(newCellar.id);
        }
      } else {
        targetCellarId = selectedCellarId ?? cellars[0].id;
        targetCellarName =
          cellars.find((c) => c.id === targetCellarId)?.name ?? 'Mi Cava';
      }

      // b) Verificar si la cosecha ya existe en la cava
      let existingItem: CellarItemDto | null = null;
      try {
        existingItem = await getCellarItemApi(targetCellarId, wine.wineVintageId);
      } catch {
        existingItem = null;
      }

      let finalTotal = quantity;

      if (existingItem) {
        // Sumar a la cantidad existente
        const finalQty = existingItem.quantity + quantity;
        if (finalQty > 999) {
          throw new Error('Alcanzarías el límite de 999 botellas para esta etiqueta en tu cava.');
        }
        finalTotal = finalQty;
        const finalDate = purchaseDate.trim()
          ? purchaseDate.trim()
          : existingItem.purchaseDate ?? null;
        const finalNotes = notes.trim() ? notes.trim() : existingItem.notes ?? null;

        await updateCellarItemApi(targetCellarId, wine.wineVintageId, {
          quantity: finalQty,
          purchaseDate: finalDate,
          notes: finalNotes,
        });
      } else {
        // Intentar POST
        try {
          await addCellarItemApi(targetCellarId, {
            wineVintageId: wine.wineVintageId,
            quantity,
            purchaseDate: purchaseDate.trim() || null,
            notes: notes.trim() || null,
          });
        } catch (postErr: unknown) {
          // c) Si el POST devuelve 409 por ítem existente (carrera concurrente), reintentar por la rama de sumar
          const anyErr = postErr as { response?: { status?: number } };
          if (anyErr?.response?.status === 409) {
            const currentItem = await getCellarItemApi(targetCellarId, wine.wineVintageId);
            const finalQty = currentItem.quantity + quantity;
            if (finalQty > 999) {
              throw new Error('Alcanzarías el límite de 999 botellas para esta etiqueta en tu cava.', { cause: postErr });
            }
            finalTotal = finalQty;
            const finalDate = purchaseDate.trim()
              ? purchaseDate.trim()
              : currentItem.purchaseDate ?? null;
            const finalNotes = notes.trim() ? notes.trim() : currentItem.notes ?? null;

            await updateCellarItemApi(targetCellarId, wine.wineVintageId, {
              quantity: finalQty,
              purchaseDate: finalDate,
              notes: finalNotes,
            });
          } else {
            throw postErr;
          }
        }
      }

      const msg = `Agregaste ${quantity} ${
        quantity === 1 ? 'botella' : 'botellas'
      } de «${wine.wineName}» a «${targetCellarName}».`;

      setSuccessInfo({ message: msg, cellarId: targetCellarId });
      setIsSubmitting(false);

      onDone({
        cellarId: targetCellarId,
        cellarName: targetCellarName,
        quantityAdded: quantity,
        totalQuantity: finalTotal,
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(
        extractCellarErrorMessage(err, 'Ocurrió un error al guardar la botella en tu cava.')
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen de la cosecha a guardar */}
      <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-stone-900 border border-white/5 flex items-center justify-center text-[#fbbf24] shrink-0">
            <Wine className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-neutral-100 truncate">
              {wine.wineName}
            </h4>
            <p className="text-xs text-neutral-400 truncate">
              {wine.wineryName || 'Sin bodega'} · {wine.vintageYear ?? 'Sin añada'}
            </p>
          </div>
        </div>

        {wine.approvalStatus === 'Pending' && (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
            Sin verificar
          </span>
        )}
      </div>

      {/* Alerta de éxito */}
      {successInfo && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successInfo.message}</span>
        </div>
      )}

      {/* Alerta de error */}
      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Error al cargar cavas */}
      {cellarsError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cellarsError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Cava (o cartel si no tiene ninguna) */}
        {isLoadingCellars ? (
          <div className="h-10 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
        ) : cellars.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
            Se creará tu primera cava («Mi cava»); podrás renombrarla desde Mi Cava.
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Cava de destino <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCellarId ?? ''}
                onChange={(e) => setSelectedCellarId(Number(e.target.value))}
                aria-label="Seleccionar cava"
                className="w-full appearance-none px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-100 text-xs sm:text-sm rounded-xl pr-9 focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
              >
                {cellars.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#16161a] text-neutral-100">
                    {c.name} ({c.bottleCount} {c.bottleCount === 1 ? 'botella' : 'botellas'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Cantidad de Botellas */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Cantidad de botellas <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={999}
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm rounded-xl pl-9 focus:outline-none focus:border-rose-500"
            />
            <Hash className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Número entero de 1 a 999. Si la botella ya está en la cava, se sumará.
          </span>
        </div>

        {/* Fecha de Compra (Opcional) */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Fecha de compra <span className="text-neutral-500 text-[11px]">(opcional)</span>
          </label>
          <div className="relative">
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm rounded-xl pl-9 focus:outline-none focus:border-rose-500"
            />
            <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Notas y Ubicación (Opcional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Notas de estiba <span className="text-neutral-500 text-[11px]">(opcional)</span>
            </label>
            <span className="text-[11px] font-mono text-neutral-500">{notes.length}/500</span>
          </div>
          <div className="relative">
            <textarea
              maxLength={500}
              rows={2}
              placeholder="Ej.: Estante A1, compartimiento inferior..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm rounded-xl pl-9 focus:outline-none focus:border-rose-500 resize-none"
            />
            <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Podés anotar el estante o ubicación donde guardás la botella.
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isLoadingCellars}
            className="px-5 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#85222e] text-white text-xs font-semibold tracking-wide transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Confirmar y Guardar</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
