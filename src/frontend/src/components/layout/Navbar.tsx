import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import type { AuthMode } from '../../features/auth/types';

interface NavbarProps {
  onOpenAuth?: (mode: AuthMode) => void;
}

/**
 * Navbar Component
 * Fija/flotante con efecto glassmorphism sutil (bg-cream-50/80 backdrop-blur-md),
 * logo tipográfico editorial en Playfair Display y acciones de acceso rápido.
 */
export default function Navbar({ onOpenAuth }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const isWineryOrAdmin = user?.role === 'Winery' || user?.role === 'Admin';

  const navLinks = [
    { label: 'Destacados', href: '/#seleccion-curada' },
    { label: 'Filosofía', href: '/#filosofia' },
    { label: 'Comunidad', href: '/#comunidad' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/85 backdrop-blur-md border-b border-cream-200/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo editorial */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-wine-900 flex items-center justify-center text-cream-50 shadow-sm group-hover:scale-105 transition-transform">
              <Wine className="w-4 h-4 text-cream-100" strokeWidth={2.2} />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-wine-900">
              AyVino
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-wine-500 mb-2"></span>
          </Link>

          {/* Navegación central (desktop) */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium tracking-wide text-earth-900/80 hover:text-wine-900 transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-wine-800 hover:after:w-full after:transition-all after:duration-250"
              >
                {link.label}
              </a>
            ))}

            {/* Enlaces contextuales protegidos */}
            {isAuthenticated && (
              <Link
                to="/catalogo"
                className="text-sm font-medium tracking-wide text-earth-900/80 hover:text-wine-900 transition-colors relative py-1 flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-wine-700" />
                Catálogo
              </Link>
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                className="text-sm font-medium tracking-wide text-wine-900 hover:text-wine-800 transition-colors relative py-1 flex items-center gap-1.5 font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-wine-700" />
                Panel Bodega
              </Link>
            )}
          </nav>

          {/* Acciones de Autenticación (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-100 border border-cream-200">
                  <UserIcon className="w-3.5 h-3.5 text-wine-800" />
                  <span className="text-xs font-semibold text-earth-900">
                    {user?.username || 'Usuario'}
                  </span>
                  {user?.role && (
                    <span className="text-[10px] uppercase font-bold text-wine-700 bg-wine-50 px-1.5 py-0.5 rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => void logout()}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-900/60 hover:text-wine-900 px-2.5 py-1.5 rounded-lg hover:bg-cream-100 transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth?.('login')}
                  type="button"
                  className="text-sm font-medium text-earth-900/80 hover:text-wine-900 px-3 py-2 transition-colors cursor-pointer"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => onOpenAuth?.('register')}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-wine-900 hover:bg-wine-800 text-cream-50 px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md hover:shadow-wine-900/20 active:scale-98 cursor-pointer"
                >
                  <span>Crear Cuenta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 text-earth-900/80 hover:text-wine-900 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cream-200 bg-cream-50/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-earth-900/90 hover:text-wine-900 py-1"
              >
                {link.label}
              </a>
            ))}

            {isAuthenticated && (
              <Link
                to="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-earth-900/90 hover:text-wine-900 py-1 flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-wine-700" />
                Catálogo
              </Link>
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-wine-900 hover:text-wine-800 py-1 flex items-center gap-2 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 text-wine-700" />
                Panel Bodega
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-cream-200 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-100">
                  <UserIcon className="w-4 h-4 text-wine-800" />
                  <span className="text-sm font-semibold text-earth-900">{user?.username}</span>
                  {user?.role && (
                    <span className="text-[10px] uppercase font-bold text-wine-700 bg-wine-50 px-1.5 py-0.5 rounded ml-auto">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  type="button"
                  className="w-full text-center py-2.5 text-sm font-medium text-wine-900 border border-wine-200 rounded-lg hover:bg-wine-50 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('login');
                  }}
                  type="button"
                  className="w-full text-center py-2.5 text-sm font-medium text-earth-900 border border-cream-200 rounded-lg hover:bg-cream-100 cursor-pointer"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('register');
                  }}
                  type="button"
                  className="w-full text-center py-2.5 text-sm font-medium bg-wine-900 text-cream-50 rounded-lg hover:bg-wine-800 cursor-pointer"
                >
                  Crear Cuenta
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
