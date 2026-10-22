import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Wine,
  Sparkles,
  ExternalLink,
  Compass,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useMyWinery } from '../hooks/useMyWinery';
import { WineryProvider } from '../context/WineryContext';
import WineryStatusBanner from './WineryStatusBanner';
import WineryLoadingState from './WineryLoadingState';
import WineryErrorState from './WineryErrorState';
import WineryLogo from './WineryLogo';

/**
 * Layout principal del Panel de Bodega (/bodega/*).
 * Provee la barra lateral de navegación, cabecera de gestión, manejo de estados
 * globales (carga, error, 404 de cuenta sin bodega) y contexto de bodega a las vistas hijas.
 */
export default function WineryLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const wineryData = useMyWinery();
  const { winery, isLoading, error, isNotFound, reload } = wineryData;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navLinks = [
    {
      label: 'Dashboard',
      to: '/bodega/dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Mi Perfil',
      to: '/bodega/perfil',
      icon: Building2,
      end: false,
    },
    {
      label: 'Mis Vinos',
      to: '/bodega/vinos',
      icon: Wine,
      end: false,
    },
    {
      label: 'Reclamar Vinos',
      to: '/bodega/reclamar',
      icon: Sparkles,
      end: false,
    },
  ];

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
      <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col justify-between">
        {/* Header simple */}
        <header className="h-18 max-w-7xl mx-auto px-6 w-full flex items-center justify-between border-b border-white/5">
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
          <div className="rounded-3xl border border-white/10 bg-[#141416] p-8 sm:p-12 text-center shadow-2xl shadow-black/80 w-full">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-sm"
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

        <footer className="py-6 text-center text-xs text-neutral-500 font-mono border-t border-white/5">
          AyVino · Panel institucional de productores
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
      <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col selection:bg-[#6b1d28] selection:text-white">
        
        {/* Cabecera Superior Fija */}
        <header className="sticky top-0 z-40 h-18 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
          
          {/* Logo y Nombre de Bodega */}
          <div className="flex items-center gap-4">
            <Link
              to="/bodega/dashboard"
              className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
            >
              AyVino<span className="text-rose-500">.</span>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-white/10" />

            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-medium">
                Panel Oficial:
              </span>
              <span className="text-xs font-semibold text-neutral-200 truncate max-w-[200px] lg:max-w-[280px]">
                {winery?.name || 'Mi Bodega'}
              </span>
            </div>
          </div>

          {/* Acciones y Perfil a la derecha */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Enlace al perfil público */}
            {winery && (
              <Link
                to={`/bodegas/${winery.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Abrir perfil público de la bodega"
              >
                <span>Ver perfil público</span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </Link>
            )}

            {/* Usuario conectado */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-200 truncate max-w-[140px]">
                {user?.username}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-rose-300 bg-rose-950/40 border border-rose-900/40 px-1.5 py-0.5 rounded">
                {user?.role || 'Winery'}
              </span>
            </div>

            {/* Botón Salir */}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900/50 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>

            {/* Toggle Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white focus:outline-none cursor-pointer"
              aria-label="Abrir menú de bodega"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Menú Desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#0f0f11] px-5 py-4 space-y-3 z-50">
            <div className="flex items-center gap-3 p-3 bg-stone-900/70 rounded-xl border border-white/5">
              <WineryLogo
                src={winery?.logoUrl}
                name={winery?.name}
                size="sm"
                className="w-10 h-10 rounded-xl shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-100 truncate">
                  {winery?.name || 'Mi Bodega'}
                </p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {user?.username} · {user?.role}
                </p>
              </div>
            </div>

            <nav className="flex flex-col space-y-1 pt-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#6e1a24]/30 text-rose-200 border border-rose-800/40'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              ))}

              <hr className="my-2 border-t border-white/5" />

              {winery && (
                <Link
                  to={`/bodegas/${winery.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="h-4 w-4 text-neutral-400" />
                    <span>Ver perfil público</span>
                  </span>
                </Link>
              )}

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              >
                <Compass className="h-4 w-4" />
                <span>Explorar catálogo general</span>
              </Link>
            </nav>

            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleLogout();
                }}
                className="w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/30 rounded-xl cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo del Layout: Sidebar + Main Content */}
        <div className="flex-1 flex min-w-0">
          
          {/* Sidebar Desktop */}
          <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#121214] border-r border-white/5 p-4 justify-between">
            
            <div className="space-y-6">
              
              {/* Bloque Identidad de Bodega */}
              <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-white/5 flex items-center gap-3">
                <WineryLogo
                  src={winery?.logoUrl}
                  name={winery?.name}
                  size="md"
                  className="w-11 h-11 rounded-xl shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-sm font-semibold text-neutral-100 truncate">
                    {winery?.name || 'Mi Bodega'}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5">
                    {winery?.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        Oficial
                      </span>
                    ) : winery?.status === 'Rejected' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-rose-400 font-medium">
                        Rechazada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-medium">
                        En revisión
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Links de Navegación del Panel */}
              <nav aria-label="Navegación del panel de bodega" className="space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                        isActive
                          ? 'bg-[#6e1a24] text-white shadow-sm'
                          : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-100'
                      }`
                    }
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Separador y Enlaces de Vista Externa */}
              <div className="pt-2 border-t border-white/5 space-y-1">
                {winery && (
                  <Link
                    to={`/bodegas/${winery.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 font-medium">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Ver perfil público</span>
                    </span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 transition-colors font-medium"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Explorar catálogo</span>
                </Link>
              </div>

            </div>

            {/* Footer del Sidebar Desktop */}
            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>

          </aside>

          {/* Área de Contenido Principal */}
          <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl w-full mx-auto space-y-6">
              {/* Banner de Estado (Pending / Rejected) */}
              {winery && <WineryStatusBanner status={winery.status} wineryName={winery.name} />}

              {/* Vistas Hijas */}
              <Outlet />
            </div>
          </main>

        </div>

      </div>
    </WineryProvider>
  );
}

