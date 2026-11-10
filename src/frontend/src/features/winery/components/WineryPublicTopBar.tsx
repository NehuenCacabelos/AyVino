import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth';
import { cn } from '../../../lib/utils';

export interface WineryPublicTopBarProps {
  backTo?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * WineryPublicTopBar Component
 * Barra superior contextual para el perfil público inmersivo de la bodega (/bodegas/:id):
 * - Logo redirige a / si es visitante (anónimo) o a /dashboard si hay sesión activa.
 * - Brinda vía de escape clara mediante el botón "← Volver".
 * - Fija en el tope con backdrop-blur e interfaces sobrias.
 */
export default function WineryPublicTopBar({
  backTo,
  backLabel = 'Volver',
  rightAction,
  className,
}: WineryPublicTopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const homeTarget = user ? '/dashboard' : '/';
  const defaultBackTarget = user ? '/dashboard' : '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14 bg-[#0b0b0e]/90 backdrop-blur-md border-b border-white/10 transition-colors',
        className,
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Lado izquierdo: Marca y Botón de Retorno */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to={homeTarget}
            className="text-lg font-bold tracking-tight text-neutral-100 hover:text-white transition-colors"
          >
            AyVino<span className="text-rose-500">.</span>
          </Link>

          <div className="h-4 w-px bg-white/10" aria-hidden="true" />

          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span>{backLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(defaultBackTarget);
                }
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span>{backLabel}</span>
            </button>
          )}
        </div>

        {/* Lado derecho: Acciones contextuales / Sesión */}
        <div className="flex items-center gap-3">
          {rightAction ? (
            rightAction
          ) : !user ? (
            <Link
              to="/login"
              className="text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Iniciar sesión
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
