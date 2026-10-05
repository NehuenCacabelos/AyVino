import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wine,
  Menu,
  X,
  ArrowRight,
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
      <header className="sticky top-0 z-40 w-full bg-[#0f0f11]/90 backdrop-blur-md border-b border-neutral-800 text-neutral-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo editorial */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-300 shadow-sm group-hover:scale-105 transition-transform">
                <Wine className="w-4 h-4 text-neutral-300" strokeWidth={2} />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-neutral-100">
                AyVino
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6b1d28] mb-1"></span>
            </Link>

            {/* Navegación central (desktop) */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) =>
                link.label === 'Comunidad' ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => setCommunityOpen(true)}
                    className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors relative py-1 cursor-pointer"
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors relative py-1"
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
                  className="text-xs font-mono uppercase tracking-widest text-neutral-200 hover:text-white transition-colors relative py-1 flex items-center gap-1.5"
                >
                  <Wine className="w-3.5 h-3.5 text-neutral-400" />
                  Mi Cava
                </Link>

                <Link
                  to="/catalogo"
                  className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors relative py-1 flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-neutral-400" />
                  Catálogo
                </Link>
              </>
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                className="text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white transition-colors relative py-1 flex items-center gap-1.5 font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
                Panel Bodega
              </Link>
            )}
          </nav>

          {/* Acciones de Autenticación (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-neutral-900 border border-neutral-800">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-200">
                    {user?.username || 'Usuario'}
                  </span>
                  {user?.role && (
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded-sm">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => void handleLogout()}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-rose-400 px-2.5 py-1.5 rounded-sm hover:bg-neutral-900 transition-colors cursor-pointer"
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
                  className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-100 px-3 py-2 transition-colors cursor-pointer"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-[#6b1d28] hover:bg-[#7e2432] text-white px-4 py-2 rounded-sm transition-colors cursor-pointer"
                >
                  <span>Crear Cuenta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 text-neutral-400 hover:text-neutral-100 focus:outline-none"
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
                  className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#6b1d28] hover:bg-[#7e2432] text-white rounded-sm cursor-pointer"
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
