import { Link } from 'react-router-dom';
import { Plus, Sparkles, Building2, ArrowUpRight } from 'lucide-react';

export interface WineryQuickActionsProps {
  wineryId?: number;
  isApproved?: boolean;
}

/**
 * WineryQuickActions Component
 * Grilla de accesos directos a las tareas operativas clave de la bodega.
 */
export default function WineryQuickActions({ wineryId, isApproved }: WineryQuickActionsProps) {
  const canViewPublicProfile = Boolean(isApproved && wineryId);

  const actions = [
    {
      title: 'Publicar etiqueta',
      description: 'Creá una nueva ficha técnica con su corte de uvas, añada inicial y temperaturas recomendadas.',
      to: '/bodega/vinos',
      icon: Plus,
      badge: 'Catálogo',
      color: 'rose',
      disabled: false,
    },
    {
      title: 'Reclamar vinos comunitarios',
      description: 'Adoptá botellas subidas por la comunidad para convertirlas en fichas oficiales conservando sus catas.',
      to: '/bodega/reclamar',
      icon: Sparkles,
      badge: 'Comunidad',
      color: 'amber',
      disabled: false,
    },
    {
      title: 'Editar perfil de bodega',
      description: 'Mantené al día la historia del viñedo, año de fundación, terruños y enlaces institucionales.',
      to: '/bodega/perfil',
      icon: Building2,
      badge: 'Institucional',
      color: 'stone',
      disabled: false,
    },
    {
      title: canViewPublicProfile ? 'Ver perfil público' : 'Perfil público (en revisión)',
      description: canViewPublicProfile
        ? 'Consultá cómo los miembros y sommeliers visualizan la vidriera de tu bodega.'
        : 'Tu vidriera oficial estará visible para toda la comunidad cuando tu bodega sea aprobada.',
      to: canViewPublicProfile ? `/bodegas/${wineryId}` : undefined,
      icon: ArrowUpRight,
      badge: canViewPublicProfile ? 'Vista Externa' : 'En Espera',
      color: 'stone',
      disabled: !canViewPublicProfile,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-neutral-100 tracking-tight">
          Accesos Rápidos
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
          Operaciones de Cava
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;

          if (act.disabled || !act.to) {
            return (
              <div
                key={act.title}
                className="p-5 rounded-2xl bg-[#141416]/50 border border-white/5 flex flex-col justify-between shadow-lg opacity-60 cursor-default"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm bg-stone-900 border-white/10 text-neutral-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                      {act.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-neutral-300">
                    {act.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1.5 font-sans leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-500">
                  <span>Disponible al aprobar</span>
                  <span>—</span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={act.title}
              to={act.to}
              className="group p-5 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between shadow-lg hover:-translate-y-0.5 duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-colors ${
                      act.color === 'rose'
                        ? 'bg-rose-950/30 border-rose-900/40 text-rose-300 group-hover:bg-rose-950/50'
                        : act.color === 'amber'
                          ? 'bg-amber-950/30 border-amber-900/40 text-amber-300 group-hover:bg-amber-950/50'
                          : 'bg-stone-900 border-white/10 text-neutral-300 group-hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    {act.badge}
                  </span>
                </div>

                <h3 className="font-serif text-base font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors">
                  {act.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 font-sans leading-relaxed">
                  {act.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-neutral-200">
                <span>Ingresar</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

