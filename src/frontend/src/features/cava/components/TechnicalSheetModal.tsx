import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Award, Mountain, Sparkles, ExternalLink, Edit2, Trash2, Calendar, FileText, AlertTriangle } from 'lucide-react';
import BottleVector from '../../dashboard/components/BottleVector';
import type { CellarWine } from '../types';
import { updateCellarItemApi, deleteCellarItemApi, extractCellarErrorMessage } from '../api/cellarApi';

interface TechnicalSheetModalProps {
  wine: CellarWine | null;
  onClose: () => void;
  onBottleUpdated?: () => void;
  onBottleRemoved?: () => void;
  onUncork?: (wine: CellarWine) => void;
}

export default function TechnicalSheetModal({
  wine,
  onClose,
  onBottleUpdated,
  onBottleRemoved,
}: TechnicalSheetModalProps) {
  // Estado para modal interno de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(wine?.units ?? 1);
  const [editPurchaseDate, setEditPurchaseDate] = useState(wine?.purchaseDate ?? '');
  const [editNotes, setEditNotes] = useState(wine?.notes ?? '');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Estado para confirmación de eliminación
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!wine) {
    return null;
  }

  const handleOpenEdit = () => {
    setEditQuantity(wine.units);
    setEditPurchaseDate(wine.purchaseDate ?? '');
    setEditNotes(wine.notes ?? '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wine.cellarId || !wine.wineVintageId) return;

    if (editQuantity < 1 || editQuantity > 999) {
      setEditError('La cantidad debe estar entre 1 y 999.');
      return;
    }

    if (editNotes && editNotes.length > 500) {
      setEditError('Las notas no pueden superar los 500 caracteres.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      await updateCellarItemApi(wine.cellarId, wine.wineVintageId, {
        quantity: editQuantity,
        purchaseDate: editPurchaseDate.trim() || null,
        notes: editNotes.trim() || null,
      });

      setIsEditing(false);
      onBottleUpdated?.();
    } catch (err: unknown) {
      setEditError(extractCellarErrorMessage(err, 'No se pudo actualizar la botella.'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteBottle = async () => {
    if (!wine.cellarId || !wine.wineVintageId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteCellarItemApi(wine.cellarId, wine.wineVintageId);
      setIsConfirmingDelete(false);
      onClose();
      onBottleRemoved?.();
    } catch (err: unknown) {
      setDeleteError(extractCellarErrorMessage(err, 'No se pudo quitar la botella de la cava.'));
      setIsDeleting(false);
    }
  };

  const hasTerroirData = Boolean(wine.altitude || wine.soilType || wine.oakAging);
  const vintageDisplay = wine.vintage != null ? wine.vintage : 'Sin añada';

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-[#0e0e11]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#fbbf24] tracking-widest uppercase">
                Ficha Técnica Enológica
              </span>
              {wine.location && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="font-mono text-[11px] text-neutral-400">{wine.location}</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
            {/* Top Hero Block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-36 h-56 rounded-xl bg-[#0a0a0c] border border-neutral-800 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(114,47,55,0.25)_0%,_transparent_75%)]" />
                {wine.imageUrl ? (
                  <img
                    src={wine.imageUrl}
                    alt={wine.name}
                    className="h-48 w-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
                  />
                ) : (
                  <BottleVector kind={wine.bottle} className="h-48 w-auto relative z-10" />
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="font-mono text-xs text-[#ffb2b8] tracking-wider uppercase font-semibold">
                    {wine.winery}
                    {wine.region ? ` · ${wine.region}` : ''}
                  </span>

                  {/* Rating / Puntaje sobre 5 */}
                  {wine.rating != null && (
                    <span className="bg-[#201f25] border border-[#fbbf24]/30 px-2 py-0.5 rounded text-[#fbbf24] font-mono text-xs font-bold flex items-center gap-1">
                      <span>{wine.rating.toFixed(1).replace('.', ',')}</span>
                      <span className="text-amber-400">★</span>
                    </span>
                  )}

                  {wine.criticBadge && (
                    <span className="bg-[#201f25] border border-[#fbbf24]/30 px-2 py-0.5 rounded text-[#fbbf24] font-mono text-xs font-bold">
                      {wine.criticBadge}
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold leading-tight">
                  {wine.name}
                </h2>

                {wine.terroirNote && (
                  <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                    {wine.terroirNote}
                  </p>
                )}

                {/* Badges of Vitals (Renderizado condicional estricto) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-left">
                  <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                    <span className="font-mono text-[9px] text-neutral-400 block uppercase">Añada</span>
                    <span className="font-serif text-sm text-neutral-200 font-medium">{vintageDisplay}</span>
                  </div>

                  <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                    <span className="font-mono text-[9px] text-neutral-400 block uppercase">En Cava</span>
                    <span className="font-serif text-sm text-neutral-200 font-medium">
                      {wine.units} {wine.units === 1 ? 'botella' : 'botellas'}
                    </span>
                  </div>

                  {wine.alcoholContent && (
                    <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                      <span className="font-mono text-[9px] text-neutral-400 block uppercase">Graduación</span>
                      <span className="font-serif text-sm text-neutral-200 font-medium">{wine.alcoholContent}</span>
                    </div>
                  )}

                  {wine.temperatureConst && (
                    <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80">
                      <span className="font-mono text-[9px] text-neutral-400 block uppercase">Custodia</span>
                      <span className="font-serif text-sm text-[#fbbf24] font-medium">{wine.temperatureConst}</span>
                    </div>
                  )}

                  {wine.purchaseDate && (
                    <div className="bg-[#18181f] p-2 rounded border border-neutral-800/80 col-span-2 sm:col-span-1">
                      <span className="font-mono text-[9px] text-neutral-400 block uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Adquisición</span>
                      </span>
                      <span className="font-serif text-sm text-neutral-200 font-medium">{wine.purchaseDate}</span>
                    </div>
                  )}
                </div>

                {/* Notas personales del usuario en esta cava */}
                {wine.notes && (
                  <div className="p-3 bg-[#18181f]/80 rounded-xl border border-white/5 text-left space-y-1">
                    <span className="font-mono text-[10px] text-neutral-400 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#fbbf24]" />
                      <span>Mis Notas de Cava</span>
                    </span>
                    <p className="text-xs text-neutral-200 font-sans italic leading-relaxed">{wine.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Terroir & Agronomic Specifications (solo si hay datos) */}
            {hasTerroirData && (
              <div className="space-y-3">
                <h4 className="font-mono text-xs text-neutral-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#fbbf24]" />
                  Terroir &amp; Crianza en Bodega
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {wine.altitude && (
                    <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase block">Altitud &amp; Clima</span>
                      <p className="text-neutral-200">{wine.altitude}</p>
                    </div>
                  )}
                  {wine.soilType && (
                    <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase block">Composición del Suelo</span>
                      <p className="text-neutral-200">{wine.soilType}</p>
                    </div>
                  )}
                  {wine.oakAging && (
                    <div className="bg-[#18181f] p-3 rounded-lg border border-neutral-800/60 space-y-1 sm:col-span-2">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase block">Régimen de Roble</span>
                      <p className="text-neutral-200">{wine.oakAging}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tasting Notes Matrix (solo si existen) */}
            {wine.tastingNotes && (
              <div className="space-y-3">
                <h4 className="font-mono text-xs text-neutral-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
                  Notas Sensoriales de Cata
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                    <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                      Fase Visual
                    </span>
                    <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.sight}</p>
                  </div>
                  <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                    <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                      Fase Olfativa
                    </span>
                    <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.nose}</p>
                  </div>
                  <div className="p-3 bg-[#18181f] rounded-lg border border-neutral-800/60">
                    <span className="font-mono text-[10px] text-[#fbbf24] uppercase block font-semibold mb-0.5">
                      Fase Gustativa
                    </span>
                    <p className="text-neutral-300 leading-relaxed">{wine.tastingNotes.mouth}</p>
                  </div>
                  <div className="p-3 bg-[#722F37]/15 rounded-lg border border-[#722F37]/35">
                    <span className="font-mono text-[10px] text-[#ffb2b8] uppercase block font-semibold mb-0.5">
                      Maridaje Sugerido
                    </span>
                    <p className="text-neutral-200 leading-relaxed">{wine.tastingNotes.pairing}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-800 bg-[#0c0c0e] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {wine.wineId && (
                <Link
                  to={`/vinos/${wine.wineId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
                >
                  <span>Ver ficha del vino</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#fbbf24]" />
                </Link>
              )}

              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Editar botella</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-neutral-300 hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-400" />
                <span>Quitar de mi cava</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {/* Botón Registrar Cata / Descorchar deshabilitado con Próximamente */}
              <button
                type="button"
                disabled
                title="Próximamente"
                aria-label="Registrar Cata / Descorchar (Próximamente)"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-neutral-800/80 text-neutral-400 opacity-60 cursor-not-allowed text-xs font-semibold border border-neutral-700/50"
              >
                <Award className="w-3.5 h-3.5 text-neutral-400" />
                <span>Registrar Cata / Descorchar</span>
                <span className="text-[9px] uppercase font-mono px-1 rounded bg-white/10 text-neutral-400">
                  Próx.
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Interno de Edición de Botella */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[#16161b] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif text-lg font-semibold text-neutral-100">Editar botella en cava</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Cantidad de botellas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-neutral-900 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Fecha de compra <span className="text-neutral-500">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-900 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Notas personales <span className="text-neutral-500">(máx. 500 caracteres)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ej: Regalo de aniversario, estiba en estante superior..."
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 resize-none"
                />
                <span className="text-[10px] text-neutral-500 block text-right">
                  {editNotes.length} / 500
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Quitar Botella */}
      {isConfirmingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[#16161b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-neutral-100">
              ¿Quitar de tu cava?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vas a quitar <span className="text-white font-medium">«{wine.name}»</span> ({vintageDisplay}) de esta cava.
              Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteBottle}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Quitando...' : 'Quitar de la cava'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
