import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Sparkles, X } from 'lucide-react';
import type { WineryResponseDto } from '../types';

export interface WineryChecklistCardProps {
  winery: WineryResponseDto;
  winesCount: number;
  onDismiss?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  actionText: string;
  actionTo: string;
}

const DISMISSED_KEY_PREFIX = 'ayvino_winery_checklist_dismissed_';
const COMPLETED_ACK_KEY_PREFIX = 'ayvino_winery_checklist_completed_ack_';

/**
 * WineryChecklistCard Component
 * Tarjeta de primeros pasos y completitud del perfil de bodega oficial.
 * Incentiva la carga de datos institucionales, terruños y primera etiqueta.
 * - Al llegar al 100%, muestra un cartel de felicitaciones con opción de no volver a mostrarse.
 * - Permite descartar/quitar la tarjeta en cualquier momento, incluso con pasos incompletos.
 * - Persistencia por bodega en localStorage con inicialización perezosa (Regla 11).
 */
export default function WineryChecklistCard({
  winery,
  winesCount,
  onDismiss,
}: WineryChecklistCardProps) {
  const dismissedKey = `${DISMISSED_KEY_PREFIX}${winery.id}`;
  const completedAckKey = `${COMPLETED_ACK_KEY_PREFIX}${winery.id}`;

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(dismissedKey) === 'true';
    } catch {
      return false;
    }
  });

  const [hasAcknowledgedCompletion, setHasAcknowledgedCompletion] = useState<boolean>(() => {
    try {
      return localStorage.getItem(completedAckKey) === 'true';
    } catch {
      return false;
    }
  });

  const items: ChecklistItem[] = [
    {
      id: 'account',
      label: 'Cuenta y registro de bodega creado',
      description: 'El perfil institucional fue dado de alta con éxito.',
      completed: true,
      actionText: 'Listo',
      actionTo: '#',
    },
    {
      id: 'logo',
      label: 'Logo oficial del establecimiento',
      description: 'Subí el logo o escudo de tu bodega para personalizar tu vidriera.',
      completed: Boolean(winery.logoUrl && winery.logoUrl.trim().length > 0),
      actionText: 'Subir logo',
      actionTo: '/bodega/configuracion',
    },
    {
      id: 'history',
      label: 'Año de fundación y semblanza histórica',
      description: 'Contá la trayectoria y filosofía enológica de tu establecimiento.',
      completed: Boolean(
        winery.foundationYear && winery.description && winery.description.trim().length >= 10,
      ),
      actionText: 'Completar',
      actionTo: '/bodega/configuracion',
    },
    {
      id: 'website',
      label: 'Sitio web y canales oficiales',
      description: 'Facilitá a los sommeliers visitar tu portal y redes institucionales.',
      completed: Boolean(winery.website && winery.website.trim().length > 0),
      actionText: 'Agregar',
      actionTo: '/bodega/configuracion',
    },
    {
      id: 'wines',
      label: 'Primera etiqueta oficial publicada',
      description: 'Publicá al menos una botella oficial con su corte de uvas y añada.',
      completed: winesCount > 0,
      actionText: 'Cargar vino',
      actionTo: '/bodega/vinos',
    },
  ];

  const completedCount = items.filter((it) => it.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const isComplete = percentage === 100;

  const handleDismissComplete = () => {
    try {
      localStorage.setItem(completedAckKey, 'true');
      localStorage.setItem(dismissedKey, 'true');
    } catch {
      // Ignorar fallas de localStorage
    }
    setHasAcknowledgedCompletion(true);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleDismissIncomplete = () => {
    try {
      localStorage.setItem(dismissedKey, 'true');
    } catch {
      // Ignorar fallas de localStorage
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  // 1. Estado al 100% de progreso
  if (isComplete) {
    if (hasAcknowledgedCompletion || isDismissed) {
      return null;
    }

    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#1c1417] via-[#141217] to-[#121015] border border-amber-500/30 p-6 sm:p-7 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 font-semibold">
                  Presencia Institucional Completa
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                  100%
                </span>
              </div>
              <h2 className="font-serif text-xl font-semibold text-white tracking-tight">
                ¡Puesta a punto completa!
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans max-w-xl">
                <span>¡Excelente! Tu bodega cuenta con presencia institucional completa.</span>{' '}
                <span className="text-neutral-400">
                  Tus etiquetas oficiales, historia y datos de contacto ya están listos para destacarse en la comunidad de enófilos.
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismissComplete}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar y no volver a mostrar"
            aria-label="Cerrar cartel de felicitaciones"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex items-center justify-end relative z-10">
          <button
            type="button"
            onClick={handleDismissComplete}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/30 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Entendido, no volver a mostrar</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Estado Incompleto descartado por el usuario
  if (isDismissed) {
    return null;
  }

  // 3. Estado Incompleto visible
  return (
    <div className="rounded-2xl bg-[#121015] border border-white/10 p-6 sm:p-7 shadow-lg space-y-5">
      {/* Cabecera y Barra de Progreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 pr-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/70 font-semibold block mb-1">
            Presencia Institucional
          </span>
          <h2 className="font-serif text-xl font-semibold text-neutral-100 tracking-tight">
            Guía de puesta a punto de tu bodega
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Completá estos pasos para que tu bodega y etiquetas se destaquen en la comunidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-3 bg-stone-900/60 border border-white/5 px-4 py-2 rounded-xl">
            <div className="text-right">
              <span className="text-xs font-mono font-medium text-neutral-400">Progreso</span>
              <p className="text-sm font-mono font-bold text-neutral-100">{percentage}%</p>
            </div>
            <div className="w-12 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6e1a24] to-amber-300 transition-all duration-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Botón para quitar la tarjeta de la vista */}
          <button
            type="button"
            onClick={handleDismissIncomplete}
            className="p-2 rounded-xl text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            title="Quitar guía de puesta a punto"
            aria-label="Quitar guía de puesta a punto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Ítems */}
      <div className="divide-y divide-white/5 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm group"
          >
            <div className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5 group-hover:text-neutral-400 transition-colors" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    item.completed ? 'text-neutral-200' : 'text-neutral-300'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">{item.description}</p>
              </div>
            </div>

            {!item.completed && (
              <Link
                to={item.actionTo}
                className="inline-flex items-center gap-1.5 self-end sm:self-auto text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 transition-colors font-medium bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 px-3 py-1.5 rounded-lg"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
