import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Wine,
  Users,
  Grape,
  UtensilsCrossed,
  History,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { cn } from '../../../lib/utils';
import { AdminToastProvider } from './AdminToast';

const adminNavLinks = [
  { label: 'Inicio', to: '/admin', end: true, icon: LayoutDashboard },
  { label: 'Bodegas', to: '/admin/bodegas', end: false, icon: Building2 },
  { label: 'Ciudades', to: '/admin/ciudades', end: false, icon: MapPin },
  { label: 'Cosechas', to: '/admin/cosechas', end: false, icon: Wine },
  { label: 'Usuarios', to: '/admin/usuarios', end: false, icon: Users },
  { label: 'Uvas', to: '/admin/uvas', end: false, icon: Grape },
  { label: 'Maridajes', to: '/admin/maridajes', end: false, icon: UtensilsCrossed },
  { label: 'Auditoría', to: '/admin/auditoria', end: false, icon: History },
];

/**
 * Layout principal del Panel de Administración (/admin/*).
 * Herramienta interna sobria, funcional y legible para el rol Admin:
 * - Sidebar lateral persistente en desktop con enlaces institucionales, retorno al sitio y cierre de sesión.
 * - Cabecera superior con identificación del usuario y badge "Admin".
 * - Menú hamburguesa colapsable para dispositivos móviles.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-[#121015] border-r border-white/10 text-neutral-200">
      {/* Cabecera Sidebar: Marca e insignia */}
      <div>
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.08]">
          <Link
            to="/admin"
            onClick={closeMobileMenu}
            className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>AyVino</span>
            <span className="text-rose-500 font-serif">.</span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#6b1d28]/40 border border-rose-900/60 text-rose-300 font-semibold">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enlaces de Navegación */}
        <nav aria-label="Navegación del panel de administración" className="p-4 space-y-1">
          {adminNavLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all',
                    isActive
                      ? 'bg-[#6b1d28] text-white shadow-sm'
                      : 'text-neutral-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pie de Sidebar: Volver y Salir */}
      <div className="p-4 border-t border-white/[0.08] space-y-1.5">
        <Link
          to="/dashboard"
          onClick={closeMobileMenu}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Volver al sitio</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            closeMobileMenu();
            void handleLogout();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#6b1d28] selection:text-white flex flex-col md:flex-row">
        {/* Sidebar Desktop fijo */}
        <aside className="hidden md:block w-64 shrink-0 min-h-screen sticky top-0 h-screen">
          {sidebarContent}
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Área Central / Contenido */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Cabecera Superior */}
          <header className="h-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                aria-label="Abrir navegación de administración"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="md:hidden text-sm font-semibold tracking-tight text-zinc-100">
                Panel Admin
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-xs font-medium text-zinc-200">
                  {user?.username || 'Administrador'}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-rose-300 bg-[#6b1d28]/40 border border-rose-900/60 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
            </div>
          </header>

          {/* Vista Hija */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}

