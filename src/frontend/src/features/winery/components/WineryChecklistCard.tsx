import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import type { WineryResponseDto } from '../types';

export interface WineryChecklistCardProps {
  winery: WineryResponseDto;
  winesCount: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  actionText: string;
  actionTo: string;
}

/**
 * WineryChecklistCard Component
 * Tarjeta de primeros pasos y completitud del perfil de bodega oficial.
 * Incentiva la carga de datos institucionales, terruños y primera etiqueta.
 */
export default function WineryChecklistCard({ winery, winesCount }: WineryChecklistCardProps) {
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
      id: 'location',
      label: 'Terruño y ubicación geográfica confirmada',
      description: 'Asigná la provincia y ciudad/valle donde nacen tus viñedos.',
      completed: Boolean(winery.locationId),
      actionText: 'Revisar',
      actionTo: '/bodega/perfil',
    },
    {
      id: 'history',
      label: 'Año de fundación y semblanza histórica',
      description: 'Contá la trayectoria y filosofía enológica de tu establecimiento.',
      completed: Boolean(
        winery.foundationYear && winery.description && winery.description.trim().length >= 10,
      ),
      actionText: 'Completar',
      actionTo: '/bodega/perfil',
    },
    {
      id: 'website',
      label: 'Sitio web y canales oficiales',
      description: 'Facilitá a los sommeliers visitar tu portal y redes institucionales.',
      completed: Boolean(winery.website && winery.website.trim().length > 0),
      actionText: 'Agregar',
      actionTo: '/bodega/perfil',
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

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/5 p-6 sm:p-7 shadow-lg space-y-5">
      {/* Cabecera y Barra de Progreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
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

        <div className="flex items-center gap-3 self-start sm:self-auto bg-stone-900/60 border border-white/5 px-4 py-2 rounded-xl">
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

      {/* Mensaje de Logro si está al 100% */}
      {isComplete && (
        <div className="pt-2 flex items-center gap-2.5 text-xs text-amber-200/90 font-mono">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>¡Excelente! Tu bodega cuenta con presencia institucional completa.</span>
        </div>
      )}
    </div>
  );
}

