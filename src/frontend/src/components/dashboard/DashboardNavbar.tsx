import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wine,
  MapPin,
  ChevronDown,
  Check,
  Menu,
  X,
  LogOut,
  Compass,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../features/auth';

interface DashboardNavbarProps {
  stockCount?: number;
  currentLocation?: string;
  onLocationChange?: (location: string) => void;
}

const locations = ['Casa Principal', 'Departamento', 'Casa de campo'];

/**
 * DashboardNavbar Component
 * Barra de navegación superior con estética editorial oscura mate (#0f0f11),
 * tipografía en caja alta tracking-widest, selector de ubicación discreto y menú de perfil.
 */
export default function DashboardNavbar({
  stockCount = 24,
  currentLocation = 'Casa Principal',
  onLocationChange,
}: DashboardNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeLocation, setActiveLocation] = useState(currentLocation);
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cerrar desplegables al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setLocationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: string) => {
    setActiveLocation(loc);
    setLocationOpen(false);
    onLocationChange?.(loc);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (!user?.username) return 'MJ';
    const parts = user.username.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const isWineryOrAdmin = user?.role === 'Winery' || user?.role === 'Admin';

  const navLinks = [
    { label: 'Explorar', href: '#catalogo', active: true },
    { label: 'Mi Cava', href: '#cava', badge: stockCount.toString() },
    { label: 'Mi Historial', href: '#historial' },
    { label: 'Maridaje', href: '#maridaje' },
    { label: 'Deseados', href: '#deseados' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-[#0f0f11]/95 backdrop-blur-md text-neutral-200 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logotipo e Isotipo Oficial (Estilo Editorial Oscuro) */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 shadow-sm transition-transform group-hover:scale-105">
            <Wine className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1">
              <span className="font-serif text-lg font-semibold tracking-tight text-neutral-100">
                MiCava
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
              Cava personal
            </span>
          </div>
        </Link>

        {/* Navegación Desktop: text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100 */}
        <nav aria-label="Navegación principal de cava" className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative py-2 text-xs uppercase tracking-widest transition-colors ${
                link.active
                  ? 'text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="ml-1.5 font-mono text-[11px] text-neutral-400">
                  {link.badge}
                </span>
              )}
              {link.active && (
                <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-neutral-200" />
              )}
            </a>
          ))}

          {isWineryOrAdmin && (
            <Link
              to="/bodega/dashboard"
              className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors ml-2 py-2"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-neutral-400" />
              <span>Bodega</span>
            </Link>
          )}
        </nav>

        {/* Acciones del Extremo Derecho: Selector de Ubicación + Avatar */}
        <div className="hidden sm:flex items-center gap-3">
          
          {/* Selector de Ubicación */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={locationOpen}
              onClick={() => setLocationOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 px-3.5 py-1.5 text-xs text-neutral-300 transition-all cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
              <span className="max-w-[130px] truncate font-mono uppercase tracking-wider text-[11px]">
                {activeLocation}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${
                  locationOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {locationOpen && (
              <ul
                role="listbox"
                aria-label="Ubicación de la cava"
                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-neutral-800 bg-[#121214] p-1.5 shadow-2xl text-neutral-200 animate-in fade-in zoom-in-95"
              >
                <li className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80">
                  Cambiar Cava / Espacio
                </li>
                {locations.map((item) => (
                  <li key={item} role="option" aria-selected={item === activeLocation}>
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(item)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                        item === activeLocation
                          ? 'bg-neutral-800/80 text-white font-semibold'
                          : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>{item}</span>
                      {item === activeLocation && (
                        <Check className="h-3.5 w-3.5 text-neutral-200" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Menú de Perfil de Usuario */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="Menú de perfil de usuario"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 font-mono text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition-all cursor-pointer"
            >
              {getUserInitials()}
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-neutral-800 bg-[#121214] p-2 shadow-2xl text-neutral-200 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-3 border-b border-neutral-800 bg-neutral-900/60 rounded-xl mb-1.5">
                  <p className="text-xs font-bold text-neutral-100 truncate">
                    {user?.username || 'Martina Sommelier'}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {user?.email || 'sommelier@ayvino.com'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-mono uppercase text-neutral-300 border border-neutral-700">
                      <Sparkles className="h-2.5 w-2.5 text-neutral-400" />
                      {user?.role || 'Miembro Cava'}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs font-medium">
                  <a
                    href="#cava"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800/60 hover:text-white transition-colors"
                  >
                    <Wine className="h-4 w-4 text-neutral-400" />
                    <span>Mi Cava ({stockCount} botellas)</span>
                  </a>

                  <Link
                    to="/catalogo"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800/60 hover:text-white transition-colors"
                  >
                    <Compass className="h-4 w-4 text-neutral-400" />
                    <span>Catálogo Oficial</span>
                  </Link>

                  {isWineryOrAdmin && (
                    <Link
                      to="/bodega/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-neutral-200 hover:bg-neutral-800/60 font-semibold transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-neutral-400" />
                      <span>Panel Bodega</span>
                    </Link>
                  )}

                  <hr className="my-1 border-neutral-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Botón de Menú Móvil */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Menú móvil"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-neutral-800 bg-[#0f0f11] px-5 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 font-mono text-sm font-bold text-neutral-200">
              {getUserInitials()}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-100">{user?.username || 'Martina Sommelier'}</p>
              <p className="text-[11px] text-neutral-400">{user?.email || 'sommelier@ayvino.com'}</p>
            </div>
          </div>

          <div className="flex flex-col space-y-1 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="font-mono text-xs text-neutral-500">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
            {isWineryOrAdmin && (
              <Link
                to="/bodega/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-xs uppercase tracking-widest text-neutral-300 font-semibold"
              >
                Panel Bodega
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                void handleLogout();
              }}
              className="w-full text-center py-2.5 rounded-md border border-neutral-800 text-neutral-300 font-medium text-xs uppercase tracking-wider hover:bg-neutral-800/60"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
