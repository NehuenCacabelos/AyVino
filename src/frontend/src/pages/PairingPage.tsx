import { PairingInteractiveHub } from '../features/pairings';

/**
 * PairingPage Component (/maridaje)
 * Guía y selector interactivo y bidireccional ("¿Qué vas a comer?" vs "¿Qué vas a tomar?"):
 * - Sincronizado reactivamente con URL SearchParams (?mode=food&food=... o ?mode=wine&wine=...).
 * - Fondo liso en color base oscuro de la aplicación (#0d0d0f) sin patrones repetitivos.
 */
export default function PairingPage() {
  return (
    <div className="relative min-h-screen bg-[#0d0d0f] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Contenido Principal de Maridaje sobre fondo liso */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-36">
        <section id="maridaje" aria-label="El Arte del Maridaje">
          <PairingInteractiveHub />
        </section>
      </main>
    </div>
  );
}
