import { Clock, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type StatusBadgeType = 'Pending' | 'Approved' | 'Rejected';

export interface StatusBadgeProps {
  status: StatusBadgeType | string;
  className?: string;
}

/**
 * Badge para representar el estado de moderación institucional (Bodegas, Ciudades, Cosechas).
 * Pendiente (ámbar), Aprobada (verde), Rechazada (rojo).
 */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'Approved':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50',
            className
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Aprobada</span>
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-800/50',
            className
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Rechazada</span>
        </span>
      );
    case 'Pending':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50',
            className
          )}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export interface ActiveBadgeProps {
  isActive: boolean;
  className?: string;
}

/**
 * Badge para representar el estado de actividad de una cuenta de usuario.
 * Activo (verde) / Inactivo (gris).
 */
export function ActiveBadge({ isActive, className }: ActiveBadgeProps) {
  if (isActive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Activo</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
        className
      )}
    >
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      <span>Inactivo</span>
    </span>
  );
}

