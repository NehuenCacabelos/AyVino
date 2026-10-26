import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  Compass,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useMyWinery } from '../hooks/useMyWinery';
import { WineryProvider } from '../context/WineryContext';
import WineryNavbar from './WineryNavbar';
import WineryStatusBanner from './WineryStatusBanner';
import WineryLoadingState from './WineryLoadingState';
import WineryErrorState from './WineryErrorState';

/**
 * Layout principal del Panel de Bodega (/bodega/*).
 * Provee la barra de navegación superior persistente (WineryNavbar), footer editorial unificado,
 * manejo de estados globales (carga, error, 404 de cuenta sin bodega) y contexto de bodega
 * a las vistas hijas vía WineryProvider y Outlet context.
 */
export default function WineryLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const wineryData = useMyWinery();
  const { winery, isLoading, error, isNotFound, reload } = wineryData;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // 1. Estado de Carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <WineryLoadingState message="Cargando panel de bodega..." />
      </div>
    );
  }

  // 2. Estado 404: La cuenta autenticada no tiene bodega asociada
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col justify-between selection:bg-[#6e1a24] selection:text-white">
        {/* Header simple */}
        <header className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between border-b border-white/[0.08]">
          <Link
            to="/dashboard"
            className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
          >
            AyVino<span className="text-rose-500">.</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </header>

        {/* Tarjeta central explicativa */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-16 flex items-center justify-center w-full">
          <div className="rounded-3xl border border-white/10 bg-[#121015] p-8 sm:p-12 text-center shadow-2xl shadow-black/80 w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900/80 border border-white/10 text-amber-200/80 mb-6 shadow-sm">
              <Building2 className="h-8 w-8" />
            </div>

            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-200/60 block mb-2 font-medium">
              Gestión Vitivinícola
            </span>

            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
              Tu cuenta no tiene una bodega asociada
            </h1>

            <p className="mt-3 text-sm text-neutral-400 font-sans leading-relaxed max-w-lg mx-auto">
              Estás conectado con el usuario <strong className="text-neutral-200">{user?.username}</strong> ({user?.email}).
              Para gestionar etiquetas, cosechas y certificaciones de terruño, podés dar de alta tu bodega oficial en AyVino.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/bodega/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar mi bodega</span>
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Compass className="h-4 w-4 text-neutral-400" />
                <span>Ir al catálogo / Mi Cava</span>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer Editorial */}
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

  // 3. Estado de Error del Servidor
  if (error && !winery) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center p-4">
        <WineryErrorState
          error={error}
          onRetry={() => void reload()}
          title="No se pudo sincronizar el panel de bodega"
        />
      </div>
    );
  }

  return (
    <WineryProvider value={wineryData}>
      <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#6e1a24] selection:text-white flex flex-col justify-between">
        {/* Navbar Superior Persistente */}
        <WineryNavbar />

        {/* Área de Contenido Principal */}
        <main className="flex-1 flex flex-col min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28">
          <div className="w-full space-y-6">
            {/* Banner de Estado (Pending / Rejected) */}
            {winery && <WineryStatusBanner status={winery.status} wineryName={winery.name} />}

            {/* Vistas Hijas */}
            <Outlet context={wineryData} />
          </div>
        </main>

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
    </WineryProvider>
  );
}
