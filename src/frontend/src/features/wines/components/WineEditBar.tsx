import { useEffect, useContext } from 'react';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';
import { Edit3, Check, X, Loader2, Sparkles } from 'lucide-react';

function DataRouterBlocker({ hasChanges, isSaving }: { hasChanges: boolean; isSaving: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && !isSaving && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker?.state === 'blocked') {
      const confirmLeave = window.confirm(
        'Tenés cambios sin guardar en esta etiqueta. ¿Estás seguro de que querés salir?'
      );
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  return null;
}

function SafeNavigationBlocker({ hasChanges, isSaving }: { hasChanges: boolean; isSaving: boolean }) {
  const dataRouterCtx = useContext(UNSAFE_DataRouterContext);
  if (!dataRouterCtx) return null;
  return <DataRouterBlocker hasChanges={hasChanges} isSaving={isSaving} />;
}

export interface WineEditBarProps {
  isEditing: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void | Promise<void>;
  isNewMode?: boolean;
  onPublish?: () => void | Promise<void>;
}

export default function WineEditBar({
  isEditing,
  isSaving,
  hasChanges,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isNewMode = false,
  onPublish,
}: WineEditBarProps) {
  // Advertencia nativa al recargar o cerrar pestaña con cambios
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleCancelClick = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        '¿Querés cancelar la edición? Los cambios no guardados se perderán.'
      );
      if (!confirmCancel) return;
    }
    onCancelEdit();
  };

  // Modo publicación (Paso 3)
  if (isNewMode) {
    return (
      <>
        <SafeNavigationBlocker hasChanges={hasChanges} isSaving={isSaving} />
        <aside
          role="toolbar"
          aria-label="Barra de publicación de etiqueta"
          className="pt-4 w-full animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => void onPublish?.()}
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-white text-xs font-semibold uppercase tracking-wider shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-500/30 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Publicando etiqueta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Publicar etiqueta</span>
              </>
            )}
          </button>
        </aside>
      </>
    );
  }

  // Modo lectura estándar para el dueño
  if (!isEditing) {
    return (
      <>
        <SafeNavigationBlocker hasChanges={hasChanges} isSaving={isSaving} />
        <aside
          role="toolbar"
          aria-label="Barra de edición de vino"
          className="pt-4 w-full animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={onStartEdit}
            className="w-full h-12 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-white text-xs font-semibold uppercase tracking-wider shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-500/30 hover:scale-[1.01]"
          >
            <Edit3 className="w-4 h-4 text-rose-200" />
            <span>Editar vino</span>
          </button>
        </aside>
      </>
    );
  }

  // Modo edición activo
  return (
    <>
      <SafeNavigationBlocker hasChanges={hasChanges} isSaving={isSaving} />
      <aside
        role="toolbar"
        aria-label="Acciones de edición de vino"
        className="pt-4 w-full flex items-center gap-3 animate-in fade-in duration-200"
      >
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={isSaving}
          className="w-1/3 sm:w-40 h-12 rounded-xl bg-neutral-900/90 border border-neutral-700/80 hover:bg-neutral-800 text-neutral-300 text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
        >
          <X className="w-4 h-4 text-neutral-400" />
          <span>Cancelar</span>
        </button>

        <button
          type="button"
          onClick={() => void onSaveEdit()}
          disabled={isSaving}
          className="flex-1 h-12 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-white text-xs font-semibold uppercase tracking-wider shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-500/30 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Guardando cambios...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Guardar edición</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
