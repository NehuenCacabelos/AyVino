import { LayoutGrid, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { WineSortOption } from '../types';

interface VaultTabsProps {
  totalCount: number;
  sortOption: WineSortOption;
  onSortChange: (sort: WineSortOption) => void;
}

export default function VaultTabs({ totalCount, sortOption, onSortChange }: VaultTabsProps) {
  return (
    <section className="space-y-4 pt-2">
      {/* Preamble: Title & Explanation without curatorial valuation banner */}
      <div className="border-b border-neutral-800/60 pb-3">
        <h2 className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold tracking-tight">
          Tus botellas
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-1 max-w-2xl leading-relaxed">
          Tu cava personal: el espacio para almacenar, organizar y llevar el registro de las botellas que guardás para descorchar.
        </p>
      </div>

      {/* Simplified Controls: List All + Sort by Vintage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => onSortChange('default')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
            sortOption === 'default'
              ? 'bg-[#722F37] text-white border-rose-500/40 shadow-[0_0_16px_rgba(114,47,55,0.4)]'
              : 'bg-[#121216] hover:bg-[#1a1a20] text-neutral-300 border-neutral-800/80 shadow-sm'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Todas las botellas</span>
          <span className="opacity-80 font-mono">({totalCount})</span>
        </button>

        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mr-1">
            Ordenar por año:
          </span>
          <button
            type="button"
            onClick={() => onSortChange(sortOption === 'vintage-desc' ? 'default' : 'vintage-desc')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              sortOption === 'vintage-desc'
                ? 'bg-[#201f25] text-[#fbbf24] border-[#fbbf24]/40 shadow-sm'
                : 'bg-[#121216] hover:bg-[#18181e] text-neutral-400 hover:text-neutral-200 border-neutral-800/80'
            }`}
          >
            <ArrowDownWideNarrow className="w-3.5 h-3.5" />
            <span>Más recientes</span>
          </button>
          <button
            type="button"
            onClick={() => onSortChange(sortOption === 'vintage-asc' ? 'default' : 'vintage-asc')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              sortOption === 'vintage-asc'
                ? 'bg-[#201f25] text-[#fbbf24] border-[#fbbf24]/40 shadow-sm'
                : 'bg-[#121216] hover:bg-[#18181e] text-neutral-400 hover:text-neutral-200 border-neutral-800/80'
            }`}
          >
            <ArrowUpNarrowWide className="w-3.5 h-3.5" />
            <span>Más antiguas</span>
          </button>
        </div>
      </div>
    </section>
  );
}
