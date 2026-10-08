import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wine,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Sparkles,
  History,
  Bookmark,
  User,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { cn } from '../../../lib/utils';
import CommunityModal from '../../../components/community/CommunityModal';

interface DashboardNavbarProps {
  stockCount?: number;
}

/**
 * DashboardNavbar Component
 * Barra de navegación superior con estética idéntica al Landing:
 * - Navbar Central (Descubrimiento): únicamente "Explorar", "Maridaje" y "Comunidad".
 * - Avatar Dropdown (Gestión Personal): Encabezado de usuario, Bloque Colección (Mi Cava con badge, Mi historial, Deseados),
 *   separador y Bloque Cuenta (Cuenta, Cerrar sesión).
 * - Efecto Smart Autohide al finalizar el Hero.
 * - Transparencia exacta al Landing (transparente en tope, translúcido con blur en scroll).
 */
export default function DashboardNavbar({
  stockCount = 24,
}: DashboardNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  const lastScrollY = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);

  // Detección optimizada de dirección de scroll:
  // - En el Hero permanece visible.
  // - Solo desaparece al scrollear hacia abajo una vez finalizado el Hero.
  // - Reaparece inmediatamente al scrollear hacia arriba.
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const heroEl = document.getElementById('hero-section');
          const heroThreshold = heroEl
            ? heroEl.offsetTop + heroEl.offsetHeight - 80
            : window.innerHeight * 0.8;

          const delta = currentScrollY - lastScrollY.current;

          // Al estar arriba de todo (scrollY <= 20px) es completamente transparente
          setIsScrolled(currentScrollY > 20);

          // Dentro del Hero siempre se mantiene visible
          if (currentScrollY <= heroThreshold) {
            setIsVisible(true);
          } else {
            // Fuera del Hero: ocultar al bajar, mostrar al subir
            if (delta > 8) {
              setIsVisible(false);
              setProfileOpen(false);
              setMobileMenuOpen(false);
            } else if (delta < -8) {
              setIsVisible(true);
            }
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Cerrar desplegable al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
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

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (!user?.username) return 'AV';
    const parts = user.username.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const isWineryOrAdmin = user?.role === 'Winery' || user?.role === 'Admin';

  // Solo secciones de descubrimiento general en la barra horizontal central
  const discoveryLinks = [
    { label: 'Explorar', href: '#catalogo' },
    { label: 'Maridaje', href: '#maridaje' },
    { label: 'Comunidad', href: '#comunidad', isModal: true },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 transform',
          isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none',
          isScrolled
            ? 'backdrop-blur-md bg-stone-950/60 border-b border-white/5 shadow-lg shadow-black/40'
            : 'bg-transparent border-b border-transparent shadow-none'
        )}
      >
        <div className="h-18 max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Columna 1 (Logo): branding oficial AyVino. idéntico al Landing */}
          <div className="flex items-center shrink-0">
            <Link
              to="/dashboard"
              className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
            >
              AyVino<span className="text-rose-500">.</span>
            </Link>
          </div>

          {/* Columna 2 (Navbar Central): únicamente descubrimiento general */}
          <nav
            aria-label="Navegación principal de descubrimiento"
            className="hidden md:flex items-center gap-8 lg:gap-10 transition-all duration-300"
          >
            {discoveryLinks.map((link) =>
              link.isModal ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => setCommunityOpen(true)}
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 cursor-pointer whitespace-nowrap"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 whitespace-nowrap"
                >
                  {link.label}
                </a>
              )
            )}

            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                className="text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150 flex items-center gap-1.5 font-semibold whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                <span>Bodega</span>
              </Link>
            )}
          </nav>

          {/* Columna 3 (Acciones): Avatar agrandado y Menú Desplegable Personal */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Menú de Perfil de Usuario */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Menú de perfil de usuario"
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/10 bg-stone-900/90 font-mono text-xs sm:text-sm font-semibold text-zinc-200 hover:border-white/25 hover:text-white hover:bg-stone-800 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-95"
              >
                {getUserInitials()}
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Gestión de usuario y bodega"
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-stone-900/95 backdrop-blur-xl p-2 shadow-2xl text-zinc-200 animate-in fade-in zoom-in-95 z-50"
                >
                  {/* Encabezado: Nombre, Email y Badge de Rol */}
                  <div className="px-3.5 py-3 border-b border-white/5 bg-stone-950/50 rounded-xl mb-1.5">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      {user?.username || 'Martina Sommelier'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {user?.email || 'sommelier@ayvino.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-white/5">
                        <Sparkles className="h-2.5 w-2.5 text-rose-400" />
                        {user?.role || 'Miembro Cava'}
                      </span>
                    </div>
                  </div>

                  {/* Bloque Colección Personal */}
                  <div className="space-y-0.5 text-xs font-medium">
                    {/* Mi Cava */}
                    <a
                      role="menuitem"
                      href="#cava"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Wine className="h-4 w-4 text-zinc-400" />
                      <span>Mi Cava</span>
                      <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                        {stockCount}
                      </span>
                    </a>

                    {/* Mi historial */}
                    <a
                      role="menuitem"
                      href="#historial"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      <History className="h-4 w-4 text-zinc-400" />
                      <span>Mi historial</span>
                    </a>

                    {/* Deseados */}
                    <a
                      role="menuitem"
                      href="#deseados"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 text-zinc-400" />
                      <span>Deseados</span>
                    </a>
                  </div>

                  {/* Separador sutil */}
                  <hr className="my-1.5 border-t border-white/5" />

                  {/* Bloque Cuenta */}
                  <div className="space-y-0.5 text-xs font-medium">
                    {/* Cuenta */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <User className="h-4 w-4 text-zinc-400" />
                      <span>Cuenta</span>
                    </button>

                    {isWineryOrAdmin && (
                      <Link
                        role="menuitem"
                        to="/bodega/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                        <span>Panel Bodega</span>
                      </Link>
                    )}

                    {/* Cerrar sesión */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Menú Móvil */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Menú de navegación"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/5 bg-stone-950/95 backdrop-blur-md px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-stone-900/60 rounded-xl border border-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 font-mono text-sm font-bold text-zinc-200">
                {getUserInitials()}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-100">{user?.username || 'Martina Sommelier'}</p>
                <p className="text-[11px] text-zinc-400">{user?.email || 'sommelier@ayvino.com'}</p>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-sm font-medium">
              {discoveryLinks.map((link) =>
                link.isModal ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCommunityOpen(true);
                    }}
                    className="text-left py-2 text-[15px] font-medium text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-[15px] font-medium text-zinc-300 hover:text-white"
                  >
                    {link.label}
                  </a>
                )
              )}

              <hr className="my-1 border-t border-white/5" />

              <a
                href="#cava"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-[15px] font-medium text-zinc-300 hover:text-white"
              >
                <span>Mi Cava</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-zinc-400">
                  {stockCount}
                </span>
              </a>

              <a
                href="#historial"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[15px] font-medium text-zinc-300 hover:text-white"
              >
                Mi historial
              </a>

              <a
                href="#deseados"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[15px] font-medium text-zinc-300 hover:text-white"
              >
                Deseados
              </a>

              {isWineryOrAdmin && (
                <Link
                  to="/bodega/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-[15px] font-medium text-zinc-200 hover:text-white"
                >
                  Panel Bodega
                </Link>
              )}
            </div>

            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleLogout();
                }}
                className="w-full text-center py-2.5 rounded-xl border border-rose-500/20 text-rose-400 font-medium text-xs uppercase tracking-wider hover:bg-rose-500/10 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Comunidad */}
      <CommunityModal isOpen={communityOpen} onClose={() => setCommunityOpen(false)} />
    </>
  );
}
