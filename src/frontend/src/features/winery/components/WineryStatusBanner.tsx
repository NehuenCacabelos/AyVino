import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WineryStatus } from '../types';

export interface WineryStatusBannerProps {
  status: WineryStatus | string;
  wineryName?: string;
  className?: string;
}

/**
 * Banner informativo del estado de moderación de la bodega.
 * Comunica de manera transparente y sobria los permisos vigentes según WineryAccessRules.
 */
export default function WineryStatusBanner({
  status,
  wineryName,
  className = '',
}: WineryStatusBannerProps) {
  if (status === 'Approved') {
    return null;
  }

  if (status === 'Pending') {
    return (
      <div
        role="status"
        aria-label="Estado de revisión de bodega"
        className={`flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 sm:p-5 text-amber-200/90 shadow-sm ${className}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 text-xs sm:text-sm font-sans leading-relaxed">
          <p className="font-semibold text-amber-200 tracking-tight">
            Tu bodega {wineryName ? `"${wineryName}"` : ''} está en revisión editorial
          </p>
          <p className="text-amber-200/80 mt-1">
            El equipo de sommeliers y administradores de AyVino está verificando los datos institucionales.
            Mientras tanto, podés editar tu perfil y preparar tus etiquetas; la publicación de vinos oficiales
            y el reclamo de botellas comunitarias se habilitarán en cuanto tu cuenta sea aprobada.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'Rejected') {
    return (
      <div
        role="alert"
        aria-label="Estado de rechazo de bodega"
        className={`flex items-start gap-3 rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4 sm:p-5 text-rose-300 shadow-sm ${className}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-900/30 text-rose-400">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 text-xs sm:text-sm font-sans leading-relaxed">
          <p className="font-semibold text-rose-200 tracking-tight">
            La solicitud de tu bodega no fue aprobada
          </p>
          <p className="text-rose-300/80 mt-1">
            Revisá que el nombre, año de fundación y ubicación coincidan con la personería real de la bodega.
            Podés actualizar tus datos desde la sección de perfil o comunicarte con nuestro equipo para solicitar una nueva revisión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300 ${className}`}>
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      <span>Bodega Oficial Verificada</span>
    </div>
  );
}

