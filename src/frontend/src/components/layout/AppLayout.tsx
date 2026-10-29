import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardNavbar } from '../../features/dashboard';

export interface AppOutletContext {
  stockCount: number;
  setStockCount: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * AppLayout Component
 * Layout compartido para la zona privada/autenticada de AyVino:
 * - Persiste DashboardNavbar y el footer compartido en el DOM, evitando desmontajes
 *   y pérdidas de estado visual al transicionar entre /dashboard, /cava, /maridaje y /catalogo.
 * - Aplica Lifting State Up para el inventario de botellas (stockCount), transmitiéndolo
 *   hacia las rutas hijas mediante el contexto de Outlet (useOutletContext).
 */
export default function AppLayout() {
  const [stockCount, setStockCount] = useState(24);

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      {/* Navbar Superior Persistente */}
      <DashboardNavbar stockCount={stockCount} />

      {/* Contenedor dinámico de rutas hijas con inyección de contexto */}
      <div className="flex-1 flex flex-col">
        <Outlet context={{ stockCount, setStockCount } satisfies AppOutletContext} />
      </div>

      {/* Footer Editorial Persistente */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
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

