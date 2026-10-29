import { Plus } from 'lucide-react';

interface VaultHeaderProps {
  userName?: string;
  onAddBottle: () => void;
}

export default function VaultHeader({ userName = 'Nehuen', onAddBottle }: VaultHeaderProps) {
  return (
    <section className="pt-2 sm:pt-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4 border-b border-neutral-800/60">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-100 font-semibold tracking-tight leading-tight">
            Bóveda Personal de {userName}
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-xl leading-relaxed">
            Archivo enológico confidencial, curva de evolución y custodia térmica de partidas selectas.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onAddBottle}
            className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-neutral-100 text-xs sm:text-sm font-semibold tracking-wide border border-rose-500/30 shadow-[0_0_24px_rgba(114,47,55,0.45)] hover:shadow-[0_0_32px_rgba(114,47,55,0.65)] transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-neutral-100 transition-transform group-hover:rotate-90 duration-200" />
            <span>Ingresar Lote / Botella</span>
          </button>
        </div>
      </div>
    </section>
  );
}
