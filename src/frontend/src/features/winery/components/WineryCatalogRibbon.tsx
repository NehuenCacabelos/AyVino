import { Wine, Layers, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { WineryCatalogTotalsDto } from '../types/catalog';

export interface WineryCatalogRibbonProps {
  totals: WineryCatalogTotalsDto;
  isWineryPending?: boolean;
}

export default function WineryCatalogRibbon({
  totals,
  isWineryPending = false,
}: WineryCatalogRibbonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Etiquetas */}
      <div className="p-4 rounded-2xl bg-[#121015] border border-white/5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            Etiquetas
          </span>
          <span className="font-serif text-2xl font-bold text-zinc-100">
            {totals.labels}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300">
          <Wine className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Añadas Totales */}
      <div className="p-4 rounded-2xl bg-[#121015] border border-white/5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            Añadas totales
          </span>
          <span className="font-serif text-2xl font-bold text-zinc-100">
            {totals.vintages}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Publicadas */}
      <div className="p-4 rounded-2xl bg-[#121015] border border-white/5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/80 block mb-1">
            Publicadas
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-400">
            {totals.vintagesApproved}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      {/* 4. En Revisión */}
      <div className="p-4 rounded-2xl bg-[#121015] border border-white/5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 block mb-1">
            En revisión
          </span>
          <span className="font-serif text-2xl font-bold text-amber-300">
            {totals.vintagesPending}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* 5. Borradores o Rechazadas */}
      <div className="p-4 rounded-2xl bg-[#121015] border border-white/5 flex items-center justify-between shadow-sm col-span-2 sm:col-span-1">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            {isWineryPending ? 'Borradores' : 'Rechazadas'}
          </span>
          <span className="font-serif text-2xl font-bold text-zinc-200">
            {isWineryPending ? totals.vintagesPending : totals.vintagesRejected}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
