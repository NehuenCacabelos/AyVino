import { Wine, SearchX, Plus, RotateCcw } from 'lucide-react';

export interface WineryCatalogEmptyStateProps {
  isFiltered: boolean;
  onResetFilters?: () => void;
  onCreateWine?: () => void;
  canCreateWine?: boolean;
}

export default function WineryCatalogEmptyState({
  isFiltered,
  onResetFilters,
  onCreateWine,
  canCreateWine = true,
}: WineryCatalogEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#121015] border border-white/5 space-y-4 shadow-sm animate-in fade-in">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-neutral-400">
          <SearchX className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="font-serif text-lg font-semibold text-zinc-100">
            No se encontraron etiquetas
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Ninguna etiqueta coincide con los filtros aplicados. Probá modificando la búsqueda o los criterios seleccionados.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer filtros</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-14 text-center rounded-2xl bg-[#121015] border border-white/5 space-y-4 shadow-sm animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-neutral-400">
        <Wine className="w-8 h-8" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-serif text-lg font-semibold text-zinc-100">
          Tu catálogo está vacío
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Comenzá cargando la primera etiqueta de tu bodega con sus cosechas y detalles para darlas a conocer a la comunidad.
        </p>
      </div>
      {canCreateWine && onCreateWine && (
        <button
          type="button"
          onClick={onCreateWine}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] border border-rose-800/40 text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cargar primera etiqueta</span>
        </button>
      )}
    </div>
  );
}
