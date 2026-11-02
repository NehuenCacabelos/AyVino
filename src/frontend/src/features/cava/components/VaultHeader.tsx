import { Plus, Edit2, Trash2, ChevronDown, Wine } from 'lucide-react';
import type { CellarDto } from '../../users/types';
import { MAX_CELLARS } from '../constants';

interface VaultHeaderProps {
  userName?: string;
  cellars: CellarDto[];
  selectedCellarId: number | null;
  onSelectCellar: (id: number) => void;
  onOpenCreateCellar: () => void;
  onOpenRenameCellar: () => void;
  onOpenDeleteCellar: () => void;
  onAddBottle?: () => void;
}

export default function VaultHeader({
  userName = 'Nehuen',
  cellars,
  selectedCellarId,
  onSelectCellar,
  onOpenCreateCellar,
  onOpenRenameCellar,
  onOpenDeleteCellar,
}: VaultHeaderProps) {
  const isMaxCellarsReached = cellars.length >= MAX_CELLARS;
  const currentCellar = cellars.find((c) => c.id === selectedCellarId) ?? cellars[0];

  return (
    <section className="pt-2 sm:pt-4 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4 border-b border-neutral-800/60">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-100 font-semibold tracking-tight leading-tight">
            Bóveda Personal de {userName}
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-xl leading-relaxed">
            Archivo enológico confidencial, curva de evolución y custodia térmica de partidas selectas.
          </p>
        </div>

        {/* Botón de ingreso de botellas: deshabilitado con "Próximamente" hasta Vista 3B */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <button
              type="button"
              disabled
              title="Próximamente"
              aria-label="Ingresar Lote / Botella (Próximamente)"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-neutral-800/80 text-neutral-400 text-xs sm:text-sm font-semibold tracking-wide border border-neutral-700/50 opacity-60 cursor-not-allowed select-none"
            >
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>Ingresar Lote / Botella</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                Próximamente
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector y Gestión de Cavas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121216] border border-white/5">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono uppercase tracking-wider">
            <Wine className="w-4 h-4 text-[#fbbf24]" />
            <span>Cava activa:</span>
          </div>

          {cellars.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={selectedCellarId ?? ''}
                  onChange={(e) => onSelectCellar(Number(e.target.value))}
                  aria-label="Seleccionar cava"
                  className="appearance-none bg-neutral-900/90 border border-white/10 hover:border-white/20 text-neutral-100 text-xs sm:text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:border-rose-500 cursor-pointer transition-colors"
                >
                  {cellars.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#141417] text-neutral-100">
                      {c.name} ({c.bottleCount} {c.bottleCount === 1 ? 'botella' : 'botellas'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {currentCellar && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenRenameCellar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    title="Renombrar esta cava"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Renombrar</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenDeleteCellar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-neutral-300 hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer"
                    title="Eliminar esta cava"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-400" />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="text-neutral-400 text-xs italic">No tenés ninguna cava creada</span>
          )}
        </div>

        {/* Botón Nueva Cava (Deshabilitado en 3 con tooltip) */}
        <div>
          <button
            type="button"
            disabled={isMaxCellarsReached}
            onClick={onOpenCreateCellar}
            title={isMaxCellarsReached ? 'Máximo 3 cavas' : 'Crear nueva cava'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all ${
              isMaxCellarsReached
                ? 'bg-neutral-900 border-white/5 text-neutral-500 opacity-60 cursor-not-allowed'
                : 'bg-[#722F37] hover:bg-[#85222e] text-white border-rose-500/40 shadow-sm cursor-pointer'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva cava</span>
            {isMaxCellarsReached && (
              <span className="font-mono text-[10px] text-neutral-400 ml-1">(Máximo 3 cavas)</span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
