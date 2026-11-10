import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  ExternalLink,
  Settings,
  Compass,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useWinery } from '../context/WineryContext';
import WineryLogo from './WineryLogo';
import { cn } from '../../../lib/utils';

/**
 * WineryNavbar Component
 * Barra de navegación superior persistente para el panel de bodega (/bodega/*).
 * Réplica visual de DashboardNavbar pero 100% desacoplada para el área institucional de productores:
 * - Logo "AyVino." a la izquierda con punto borgoña.
 * - Enlaces de navegación institucional con NavLink e isActive.
 * - Avatar/Logo de la bodega con menú desplegable para Configuración, Ver perfil público y Cerrar sesión.
 * - Menú responsive para dispositivos móviles.
 */
export default function WineryNavbar() {
  const { user, logout } = useAuth();
  const { winery } = useWinery();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navLinks = [
    { label: 'Inicio', to: '/bodega/dashboard', end: true },
    { label: 'Mi catálogo', to: '/bodega/vinos', end: false },
    { label: 'Reclamar vinos', to: '/bodega/reclamar', end: false },
    { label: 'Mi perfil', to: '/bodega/perfil', end: false },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Marca AyVino. y Enlaces Principales */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            to="/bodega/dashboard"
            className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors shrink-0"
          >
            AyVino<span className="text-rose-500">.</span>
          </Link>

          <span className="hidden md:inline-block h-4 w-px bg-white/10" aria-hidden="true" />

          {/* Enlaces de Navegación Desktop */}
          <nav aria-label="Navegación del panel de bodega" className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all',
                    isActive
                      ? 'bg-[#6e1a24] text-white shadow-sm'
                      : 'text-neutral-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Lado Derecho: Menú de Bodega y Toggle Móvil */}
        <div className="flex items-center gap-3">
          
          {/* Badge de Estado en Desktop */}
          {winery && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border">
              {winery.status === 'Approved' ? (
                <span className="flex items-center gap-1 text-emerald-400 border-emerald-900/40 bg-emerald-950/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Oficial
                </span>
              ) : winery.status === 'Rejected' ? (
                <span className="flex items-center gap-1 text-rose-400 border-rose-900/40 bg-rose-950/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rechazada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-300 border-amber-900/40 bg-amber-950/30">
                  <Clock className="w-3.5 h-3.5" />
                  En revisión
                </span>
              )}
            </div>
          )}

          {/* Desplegable de Bodega (Desktop) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-white/10 transition-all cursor-pointer focus:outline-none"
              aria-label="Abrir menú de bodega"
              aria-expanded={menuOpen}
            >
              <WineryLogo
                src={winery?.logoUrl}
                name={winery?.name}
                size="sm"
                className="w-9 h-9 rounded-full ring-2 ring-white/10"
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141416] border border-white/10 p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95">
                {/* Encabezado del Dropdown */}
                <div className="p-3 bg-stone-900/50 rounded-xl border border-white/5 mb-1.5">
                  <p className="font-serif text-sm font-semibold text-zinc-100 truncate">
                    {winery?.name || 'Mi Bodega'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                    {user?.email || 'bodega@ayvino.com'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                    {winery?.status === 'Approved' ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Bodega Aprobada
                      </span>
                    ) : winery?.status === 'Rejected' ? (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Cuenta Rechazada
                      </span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" /> Pendiente de Aprobación
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-0.5 text-xs font-sans">
                  <Link
                    to="/bodega/configuracion"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Configuración de bodega</span>
                  </Link>

                  {winery && (
                    <Link
                      to={`/bodegas/${winery.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                      <span className="flex items-center gap-2.5">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Ver perfil público</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors font-medium"
                  >
                    <Compass className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Explorar como usuario</span>
                  </Link>
                </div>

                <div className="my-1.5 border-t border-white/5" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Menú Móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
            aria-label="Abrir navegación móvil"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0f0f11]/95 backdrop-blur-md px-5 py-4 space-y-3 z-50">
          <div className="flex items-center gap-3 p-3 bg-stone-900/60 rounded-xl border border-white/5">
            <WineryLogo
              src={winery?.logoUrl}
              name={winery?.name}
              size="sm"
              className="w-10 h-10 rounded-full shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {winery?.name || 'Mi Bodega'}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {user?.username} · {user?.role}
              </p>
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors',
                    isActive
                      ? 'bg-[#6e1a24] text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <hr className="my-1.5 border-t border-white/5" />

            <Link
              to="/bodega/configuracion"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>Configuración</span>
            </Link>

            {winery && (
              <Link
                to={`/bodegas/${winery.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ver perfil público</span>
                </span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </Link>
            )}

            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
            >
              <Compass className="w-3.5 h-3.5 text-neutral-500" />
              <span>Explorar catálogo</span>
            </Link>
          </nav>

          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                void handleLogout();
              }}
              className="w-full text-center py-2.5 rounded-xl border border-rose-500/20 text-rose-400 font-medium text-xs font-mono uppercase tracking-wider hover:bg-rose-500/10 cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
