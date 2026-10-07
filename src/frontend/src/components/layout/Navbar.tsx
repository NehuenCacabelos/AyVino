import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wine,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Compass,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../features/auth';
import CommunityModal from '../community/CommunityModal';

/**
 * Navbar Component
 * Barra de navegación principal alineada con la estética editorial de cava oscura (#0f0f11),
 * bordes estructurales border-neutral-800, tipografía font-mono para metadatos y acento #6b1d28.
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const isWineryOrAdmin = user?.role === 'Winery' || user?.role === 'Admin';

  const navLinks = [
    { label: 'Destacados', href: '/#seleccion-curada' },
    { label: 'Filosofía', href: '/#filosofia' },
    { label: 'Comunidad', href: '#comunidad' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0a0c]/80 backdrop-blur-md transition-all">
        <div className="h-18 max-w-7xl mx-auto px-6 flex justify-between md:grid md:grid-cols-3 items-center">
          
          {/* Columna 1 (Logo): texto con mayor presencia y punto borravino */}
          <div className="flex items-center md:justify-self-start">
            <Link to="/" className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors">
              AyVino<span className="text-rose-500">.</span>
            </Link>
          </div>

          {/* Columna 2 (Nav links): centrada exactamente en escritorio, mayor escala y gap-10 */}
          <nav className="hidden md:flex justify-center gap-10">
            {navLinks.map((link) =>
              link.label === 'Comunidad' ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => setCommunityOpen(true)}
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150"
                >
                  {link.label}
                </a>
              )
            )}

            {/* Enlaces contextuales protegidos */}
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Wine className="w-3.5 h-3.5 text-zinc-400" />
                  Mi Cava
                </Link>

                <Link
                  to="/catalogo"
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-zinc-400" />
                  Catálogo
                </Link>
              </>
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 flex items-center gap-1.5 font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                Panel Bodega
              </Link>
            )}
          </nav>

          {/* Columna 3 (Acciones): alineada al final */}
          <div className="flex items-center gap-4 md:justify-self-end">
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">
                      {user?.username || 'Usuario'}
                    </span>
                    {user?.role && (
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => void handleLogout()}
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Salir</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-3 py-1.5 cursor-pointer"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            {/* En mobile: acción esencial + botón menú móvil */}
            <div className="md:hidden flex items-center gap-2">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="text-xs font-medium text-zinc-300 hover:text-white transition-colors px-2 py-1 cursor-pointer"
                >
                  Ingresar
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                className="p-1.5 text-zinc-400 hover:text-zinc-100 focus:outline-none cursor-pointer"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#0f0f11] px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) =>
              link.label === 'Comunidad' ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCommunityOpen(true);
                  }}
                  className="text-left text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white py-1 cursor-pointer"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white py-1"
                >
                  {link.label}
                </a>
              )
            )}

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-mono uppercase tracking-wider text-neutral-200 hover:text-white py-1 flex items-center gap-2"
                >
                  <Wine className="w-4 h-4 text-neutral-400" />
                  Mi Cava
                </Link>

                <Link
                  to="/catalogo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white py-1 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-neutral-400" />
                  Catálogo
                </Link>
              </>
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono uppercase tracking-wider text-neutral-200 hover:text-white py-1 flex items-center gap-2 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                Panel Bodega
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-sm bg-neutral-900 border border-neutral-800">
                  <UserIcon className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-200">{user?.username}</span>
                  {user?.role && (
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded-sm ml-auto">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleLogout();
                  }}
                  type="button"
                  className="w-full text-center py-2.5 text-xs font-mono uppercase tracking-wider text-neutral-300 border border-neutral-800 rounded-sm hover:bg-neutral-900 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-mono uppercase tracking-wider text-neutral-300 border border-neutral-800 rounded-sm hover:bg-neutral-900 cursor-pointer"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-lg cursor-pointer transition-all"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Modal Editorial de Próximamente para Comunidad */}
    <CommunityModal isOpen={communityOpen} onClose={() => setCommunityOpen(false)} />
  </>
);
}
