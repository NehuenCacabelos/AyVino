import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface WineryTopBarProps {
  backTo: string;
  backLabel: string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * WineryTopBar Component
 * Barra superior contextual minimalista para vistas inmersivas de bodega (/bodega/configuracion y /bodega/perfil):
 * - Oculta la sobrecarga del Navbar global para maximizar el espacio útil en formularios y fichas.
 * - Brinda vía de escape clara mediante el logo AyVino. (enlazando a /bodega/dashboard) y botón "← Volver".
 * - Fija en el tope con backdrop-blur e interfaces de bordes rectos sobrios (h-14, bg-[#0b0b0e]/90).
 */
export default function WineryTopBar({
  backTo,
  backLabel,
  rightAction,
  className,
}: WineryTopBarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14 bg-[#0b0b0e]/90 backdrop-blur-md border-b border-white/10 transition-colors',
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Lado izquierdo: Marca enlazando a /bodega/dashboard y Botón de Retorno */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/bodega/dashboard"
            className="text-lg font-bold tracking-tight text-neutral-100 hover:text-white transition-colors"
          >
            AyVino<span className="text-rose-500">.</span>
          </Link>

          <div className="h-4 w-px bg-white/10" aria-hidden="true" />

          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span>{backLabel}</span>
          </Link>
        </div>

        {/* Lado derecho: Acciones contextuales opcionales */}
        {rightAction && (
          <div className="flex items-center gap-3">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}
