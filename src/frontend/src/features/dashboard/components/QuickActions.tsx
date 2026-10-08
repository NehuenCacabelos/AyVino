import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../auth';
import type { DashboardWine } from '../../../types/wine';

interface QuickActionsProps {
  onSearch?: (query: string) => void;
  onRegisterBottle?: () => void;
  onSelectSpotlightWine?: (wineName: string) => void;
  onUncorkSpotlight?: (wine: DashboardWine) => void;
}

/**
 * QuickActions Component (Hero de Dashboard / AyVino)
 * Layout centrado, equilibrado y editorial:
 * - Contenido textual centrado: Saludo/eyebrow, "¿Qué vamos a descorchar hoy?", subtítulo.
 * - Barra de búsqueda única centrada tipo píldora simétrica con ícono Search integrado (sin botón adyacente).
 */
export default function QuickActions({
  onSearch,
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
      {/* Eyebrow / Saludo: text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium */}
      <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium">
        {getGreeting().toUpperCase()}, {displayName.toUpperCase()}
      </p>

      {/* Titular Principal: Fraunces font-semibold text-neutral-100 tracking-tight */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <h1
          id="welcome-title"
          className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-100 tracking-tight leading-[1.12]"
        >
          ¿Qué vamos a descorchar hoy?
        </h1>
        <div className="h-[1px] w-14 bg-neutral-700/80 mt-1" aria-hidden="true" />
      </div>

      {/* Bajada con contraste suave y ancho centrado equilibrado */}
      <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-neutral-400 font-sans max-w-2xl">
        Tu cava, tu historial de cata y las mejores bodegas argentinas, reunidas en un solo lugar.
      </p>

      {/* Barra de Búsqueda Única Centrada tipo Píldora */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="mt-8 flex w-full max-w-xl sm:max-w-2xl mx-auto items-center rounded-full border border-white/10 bg-stone-900/50 backdrop-blur-md px-5 py-1.5 focus-within:border-white/20 transition-all shadow-xl shadow-black/25 group"
      >
        <label htmlFor="wine-search" className="sr-only">
          Buscar vino, bodega, cepa o maridaje...
        </label>

        {/* Ícono de Lupa a la izquierda */}
        <Search className="h-5 w-5 text-stone-400 shrink-0 mr-3.5 group-focus-within:text-stone-200 transition-colors" aria-hidden="true" />

        <input
          id="wine-search"
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          placeholder="Buscar vino, bodega, cepa o maridaje..."
          className="h-11 sm:h-12 w-full bg-transparent text-sm sm:text-base text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans"
        />
      </form>
    </div>
  );
}
