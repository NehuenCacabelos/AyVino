import { useState } from 'react';
import { PairingInteractiveHub } from '../features/pairings';
import type { HubMode } from '../features/pairings/components/PairingInteractiveHub';

/**
 * PairingPage Component (/maridaje)
 * Guía y selector interactivo y bidireccional ("¿Qué vas a comer?" vs "¿Qué vas a tomar?"):
 * - Vinculado a la opción "Maridaje" de la barra de navegación superior compartida en AppLayout.
 * - Integra selector de afinidades gastronómicas, notas de cata de sommelier y vinculación a botellas reales.
 * - Adopta el sistema de superficies "Dark Editorial" (#0d0d0f) con elevación unificada.
 */
export default function PairingPage() {
  const [activeMode, setActiveMode] = useState<HubMode>('food');

  return (
    <div className="relative min-h-screen bg-[#0d0d0f] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Contenido Principal de Maridaje */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-36">
        {/* Hub Interactivo Bidireccional */}
        <section id="maridaje" aria-label="El Arte del Maridaje">
          <PairingInteractiveHub
            currentMode={activeMode}
            onModeChange={setActiveMode}
          />
        </section>
      </main>
    </div>
  );
}
