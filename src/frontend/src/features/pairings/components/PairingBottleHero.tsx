import { Link } from 'react-router-dom';
import { Wine as WineIcon, ArrowRight } from 'lucide-react';
import { WineCard } from '../../wines';
import type { CuratedWine } from '../../../types/wine';

interface PairingBottleHeroProps {
  wines: CuratedWine[];
  onOpenWineModal: (wine: CuratedWine) => void;
  pairingTitle: string;
}

export default function PairingBottleHero({
  wines,
  onOpenWineModal,
  pairingTitle,
}: PairingBottleHeroProps) {
  return (
    <section aria-label="Botellas recomendadas del catálogo" className="flex flex-col gap-5 pt-4">
      {/* Encabezado Editorial Limpio */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <WineIcon className="w-4 h-4 text-rose-300" />
          <h3 className="font-serif text-lg sm:text-xl font-semibold text-neutral-100">
            Botellas recomendadas en catálogo{' '}
            <span className="font-mono text-xs font-normal text-zinc-400">({wines.length})</span>
          </h3>
        </div>

        <Link
          to="/catalogo"
          className="text-xs font-sans text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors group"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grilla de Botellas Héroe con Alto Contraste */}
      {wines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wines.map((wine) => (
            <div
              key={wine.id}
              onClick={() => onOpenWineModal(wine)}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-1.5"
            >
              <WineCard wine={wine} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-1.5">
            <span className="font-serif text-base text-neutral-200">
              Próximamente nuevas etiquetas para {pairingTitle}
            </span>
            <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
              Nuestros sommeliers están seleccionando etiquetas que armonicen con este perfil específico. Mientras tanto, podés explorar las etiquetas disponibles en nuestro catálogo curado.
            </p>
          </div>

          <Link
            to="/catalogo"
            className="px-4 py-2 rounded-lg bg-[#4f131f] hover:bg-[#5e1725] text-rose-100 border border-rose-400/20 text-xs font-sans font-medium flex items-center gap-2 shrink-0 transition-colors shadow-sm"
          >
            <span>Explorar Catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
