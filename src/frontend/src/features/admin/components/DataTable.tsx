import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  isLoading: boolean;
  emptyMessage: string;
}

/**
 * Tabla de datos genérica para vistas administrativas.
 * Soporta estados de carga con filas esqueleto, scroll horizontal en mobile y estado vacío.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  emptyMessage,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#121015] shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#0c0c0e]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-sm text-neutral-200">
            {isLoading ? (
              // 5 Filas esqueleto mientras carga
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`skeleton-col-${col.key}`} className="px-4 py-4">
                      <div className="h-5 bg-white/5 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Fila vacía
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-neutral-400"
                >
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              // Filas de datos
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5 align-middle', col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

