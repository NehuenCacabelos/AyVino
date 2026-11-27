import { Outlet } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';

/**
 * WineryPublicLayout Component
 * Layout compartido para las vistas institucionales públicas del área de bodegas:
 * - Persiste el Navbar compartido sin recargar ni remontar entre vistas.
 * - Provee el contenedor de rutas hijas con <Outlet />.
 * - Renderiza el footer institucional y legal compartido.
 */
export default function WineryPublicLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-[#6b1d28] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Navbar Superior Compartido */}
      <Navbar />

      {/* Contenedor de Vistas Públicas Hijas */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      {/* Footer Editorial de Bodegas */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
            <span className="text-neutral-600">|</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Espacio Oficial de Bodegas y Productores
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}
