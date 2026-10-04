import { useState } from 'react';
import StockCarousel from './StockCarousel';
import OnboardingBanner from './OnboardingBanner';
import type { DashboardWine, UncorkSubmission } from '../../types/wine';

type ViewMode = 'stock' | 'new';

const viewOptions: { id: ViewMode; label: string }[] = [
  { id: 'stock', label: 'Con Stock' },
  { id: 'new', label: 'Usuario Nuevo' },
];

interface DashboardSectionProps {
  onUncorkSaved?: (data: UncorkSubmission) => void;
  onUncorkRequested?: (wine: DashboardWine) => void;
  onAddBottleRequested?: () => void;
}

/**
 * DashboardSection Component
 * Sección central de "Mi Cava" con estética oscura mate (#0f0f11),
 * tipografía Fraunces semi-bold y selector de estado discreto.
 */
export default function DashboardSection({
  onUncorkRequested,
  onAddBottleRequested,
}: DashboardSectionProps) {
  const [view, setView] = useState<ViewMode>('stock');

  return (
    <section id="cava" aria-labelledby="cava-main-title" className="flex flex-col gap-8">
      
      {/* Barra de Encabezado y Switch de Vistas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-medium">
            INVENTARIO PERSONAL
          </span>
          <h2 id="cava-main-title" className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 mt-1">
            Mi Cava
          </h2>
        </div>

        {/* Switch de Vistas (Con Stock / Usuario Nuevo) */}
        <div
          role="radiogroup"
          aria-label="Selector de estado de cava"
          className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-[#121214] p-1 shadow-sm self-start sm:self-auto"
        >
          <span className="pl-2.5 pr-1 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            Vista:
          </span>
          {viewOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={view === option.id}
              onClick={() => setView(option.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                view === option.id
                  ? 'bg-[#722F37] text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Condicional: Carrusel de Inventario o Banner Onboarding */}
      {view === 'stock' ? (
        <StockCarousel onUncork={(wine) => onUncorkRequested?.(wine)} />
      ) : (
        <OnboardingBanner onAddFirstBottle={onAddBottleRequested} />
      )}

    </section>
  );
}
