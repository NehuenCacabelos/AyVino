import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  itemsOnPage: number;
  totalCount?: number | null;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Controles de paginación para tablas del panel de administración.
 * Si recibe `totalCount`, muestra total de páginas/resultados y botones primera/última.
 * Sin `totalCount` (`null`/`undefined`), conserva navegación Anterior/Siguiente clásica.
 */
export default function PaginationControls({
  page,
  pageSize,
  itemsOnPage,
  totalCount = null,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const hasTotal = totalCount !== null && totalCount !== undefined;
  const totalPages = hasTotal ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  const isFirstPage = page <= 1;
  const isLastPage = totalPages !== null ? page >= totalPages : itemsOnPage < pageSize;

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    onPageSizeChange(newSize);
    onPageChange(1);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-xs font-sans text-neutral-400">
      {/* Selector de Tamaño */}
      <div className="flex items-center gap-2">
        <span>Filas por página:</span>
        <select
          value={pageSize}
          onChange={handleSizeChange}
          aria-label="Seleccionar filas por página"
          className="rounded-lg border border-white/10 bg-[#141416] px-2.5 py-1 text-xs text-neutral-200 focus:border-rose-500 focus:outline-none cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Navegación y Página */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-mono text-neutral-300">
          {totalPages !== null
            ? `Página ${page} de ${totalPages} · ${totalCount} resultados`
            : `Página ${page}`}
        </span>
        <div className="flex items-center gap-1.5">
          {totalPages !== null && (
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={isFirstPage}
              aria-label="Primera página"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141416] px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Primera</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirstPage}
            aria-label="Página anterior"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141416] px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={isLastPage}
            aria-label="Página siguiente"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141416] px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {totalPages !== null && (
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={isLastPage}
              aria-label="Última página"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141416] px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Última</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
