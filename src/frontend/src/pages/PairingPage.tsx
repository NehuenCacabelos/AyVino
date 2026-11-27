import { PairingInteractiveHub } from '../features/pairings';

/**
 * PairingPage Component (/maridaje)
 * Guía y selector interactivo y bidireccional ("¿Qué vas a tomar?" vs "¿Qué vas a comer?"):
 * - Sincronizado reactivamente con URL SearchParams (?mode=wine&wine=... o ?mode=food&food=...).
 * - Fondo oscuro sobrio (#0a0a0c) alineado con WineDetailPage.
 */
export default function PairingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-[#e5e1e4] antialiased selection:bg-[#722f37] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Contenido Principal de Maridaje Tipográfico */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-36">
        <section id="maridaje" aria-label="El Arte del Maridaje">
          <PairingInteractiveHub />
        </section>
      </main>
    </div>
  );
}
