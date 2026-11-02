import { LayoutGrid, Sparkles, Clock, ShieldAlert, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { VaultTab, WineSortOption } from '../types';

interface VaultTabsProps {
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  totalCount: number;
  jewelsCount: number;
  sortOption: WineSortOption;
  onSortChange: (sort: WineSortOption) => void;
}

export default function VaultTabs({
  activeTab,
  onTabChange,
  totalCount,
  jewelsCount,
  sortOption,
  onSortChange,
}: VaultTabsProps) {
  const tabs: { id: VaultTab; label: string; count?: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'Todas las botellas', count: totalCount, icon: LayoutGrid },
    { id: 'jewels', label: 'Joyas', count: jewelsCount, icon: Sparkles },
    { id: 'optimal', label: 'Óptimas', icon: Clock },
    { id: 'guard', label: 'En guarda', icon: ShieldAlert },
  ];

  return (
    <section className="space-y-4 pt-2">
      {/* Encabezado Editorial */}
      <div className="border-b border-neutral-800/60 pb-3">
        <h2 className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold tracking-tight">
          Tus botellas
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-1 max-w-2xl leading-relaxed">
          Tu cava personal: el espacio para almacenar, organizar y llevar el registro de las botellas que guardás para descorchar.
        </p>
      </div>

      {/* Controles: Pestañas + Ordenamiento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Pestañas de filtrado */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#722F37] text-white border-rose-500/40 shadow-[0_0_16px_rgba(114,47,55,0.4)]'
                    : 'bg-[#121216] hover:bg-[#1a1a20] text-neutral-400 hover:text-neutral-200 border-neutral-800/80 shadow-sm'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#fbbf24]' : 'text-neutral-500'}`} />
                <span>{t.label}</span>
                {typeof t.count === 'number' && (
                  <span className="opacity-80 font-mono">({t.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Ordenamiento por año (solo visible en pestañas con listado: all o jewels) */}
        {(activeTab === 'all' || activeTab === 'jewels') && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mr-1">
              Ordenar por año:
            </span>
            <button
              type="button"
              onClick={() => onSortChange(sortOption === 'vintage-desc' ? 'default' : 'vintage-desc')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                sortOption === 'vintage-asc'
                  ? 'bg-[#201f25] text-[#fbbf24] border-[#fbbf24]/40 shadow-sm'
                  : 'bg-[#121216] hover:bg-[#18181e] text-neutral-400 hover:text-neutral-200 border-neutral-800/80'
              }`}
            >
              <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              <span>Más antiguas</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
