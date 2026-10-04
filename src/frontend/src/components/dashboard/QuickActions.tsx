import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../features/auth';
import heroBottlesImg from '../../assets/hero-bottles.png';
import type { DashboardWine } from '../../types/wine';

interface QuickActionsProps {
  onSearch?: (query: string) => void;
  onRegisterBottle?: () => void;
  onSelectSpotlightWine?: (wineName: string) => void;
  onUncorkSpotlight?: (wine: DashboardWine) => void;
}

/**
 * QuickActions Component (Hero de Dos Columnas — Dirección de Arte MiCava / AyVino)
 * Estilo editorial moderno con fondo oscuro carbón mate (#0f0f11):
 * - Columna Izquierda:
 *   - Eyebrow: text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium.
 *   - Título h1: Fraunces font-semibold text-neutral-100 tracking-tight (sin cursivas ni trazos finos).
 *   - Bajada: text-neutral-400 font-sans.
 *   - Buscador integrado: bg-neutral-900/60 con backdrop-blur-sm, border-neutral-800, placeholder text-neutral-500
 *     y botón primario + REGISTRAR BOTELLA en bordó sobrio (#722F37).
 * - Columna Derecha:
 *   - Fotografía de bodega y botellas en mesa rústica con veladoras y uvas, con transición orgánica
 *     en tonos cálidos e iluminación sobria.
 */
export default function QuickActions({
  onSearch,
  onRegisterBottle,
}: QuickActionsProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Saludo contextual según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return 'Buenos días';
    if (hour >= 13 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.username ? user.username.split(' ')[0] : 'Martina';

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <section
      aria-labelledby="welcome-title"
      className="relative isolate overflow-hidden bg-[#0f0f11] text-neutral-200 border-b border-neutral-800/80 py-14 sm:py-18 lg:py-20"
    >
      {/* Luz ambiental sutil y cálida */}
      <div
        className="absolute top-1/3 right-1/4 -z-10 h-96 w-96 rounded-full bg-amber-900/5 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ========================================================
              COLUMNA IZQUIERDA: Saludo, Titular, Bajada y Buscador
              ======================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-center gap-6">
            
            {/* Eyebrow / Saludo: text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium */}
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium">
              {getGreeting().toUpperCase()}, {displayName.toUpperCase()}
            </p>

            {/* Titular Principal: Fraunces font-semibold text-neutral-100 tracking-tight */}
            <div className="flex flex-col gap-3">
              <h1
                id="welcome-title"
                className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-semibold text-neutral-100 tracking-tight leading-[1.12]"
              >
                ¿Qué vamos a descorchar hoy?
              </h1>
              
              {/* Línea divisoria sutil */}
              <div className="h-[1px] w-14 bg-neutral-700/80 mt-1" aria-hidden="true" />
            </div>

            {/* Bajada con contraste suave */}
            <p className="text-sm sm:text-base leading-relaxed text-neutral-400 font-sans max-w-lg">
              Tu cava, tu historial de cata y las mejores bodegas argentinas, reunidas en un solo lugar.
            </p>

            {/* Buscador Integrado con Botón + REGISTRAR BOTELLA */}
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-md border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden focus-within:border-neutral-700 transition-all max-w-xl shadow-sm mt-2"
            >
              <label htmlFor="wine-search" className="sr-only">
                Buscar vino, bodega, cepa o maridaje...
              </label>

              <input
                id="wine-search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="Buscar vino, bodega, cepa o maridaje..."
                className="h-12 w-full bg-transparent px-4 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans"
              />

              <button
                type="button"
                onClick={onRegisterBottle}
                className="inline-flex h-12 items-center justify-center gap-2 bg-[#722F37] hover:bg-[#5c1d24] text-neutral-100 px-6 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer shrink-0 active:scale-[0.99]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>+ REGISTRAR BOTELLA</span>
              </button>
            </form>

          </div>

          {/* ========================================================
              COLUMNA DERECHA: Fotografía de Cava con Transición Orgánica
              ======================================================== */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl">
              
              {/* Máscara de degradado orgánico lateral y base para fundir con el fondo #0f0f11 */}
              <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0f0f11] via-[#0f0f11]/60 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f0f11] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0f0f11]/70 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0f0f11]/80 to-transparent z-10 pointer-events-none" />

              {/* Imagen de la referencia */}
              <img
                src={heroBottlesImg}
                alt="Selección de botellas de cava y copa en mesa rústica"
                className="w-full h-auto object-cover rounded-xl filter contrast-[1.03] brightness-[0.98] select-none"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
