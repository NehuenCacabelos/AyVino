import { Wine, Clock, Layers, Award } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Wine;
}

export interface MetricsProps {
  customStats?: {
    bottles?: number;
    varietals?: string | number;
    topRated?: string | number;
    readyToDrink?: string | number;
    dominantVarietal?: string;
  };
}

/**
 * Metrics Component (Cinta de Métricas y KPIs — Estilo Oscuro Mate)
 * Franja horizontal compacta con estética sobria y fondo carbón profundo (#121214):
 * - Bordes de 1px con border-neutral-800.
 * - Etiquetas en font-mono uppercase tracking-[0.2em] text-neutral-400.
 * - Números y valores en Fraunces font-semibold text-neutral-100.
 */
export default function Metrics({ customStats }: MetricsProps) {
  const stats: MetricItem[] = [
    {
      label: 'Total en Cava',
      value: `${customStats?.bottles ?? 24} Botellas`,
      detail: 'Listas para descorchar',
      icon: Wine,
    },
    {
      label: 'Listas para tomar',
      value: `${customStats?.readyToDrink ?? 3} Botellas`,
      detail: 'En ventana óptima',
      icon: Clock,
    },
    {
      label: 'Varietal dominante',
      value: customStats?.dominantVarietal ?? 'Malbec (58%)',
      detail: '8 cepas en inventario',
      icon: Layers,
    },
    {
      label: 'Valoración promedio',
      value: customStats?.topRated ?? '4.8 / 5.0 ★',
      detail: 'Nivel Gran Reserva',
      icon: Award,
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-800 bg-[#121214] shadow-sm transition-all">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <li
            key={label}
            className="flex items-center gap-4 px-6 py-4 sm:py-5 hover:bg-neutral-800/30 transition-colors group"
          >
            {/* Micro-icono lineal en círculo sutil */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 group-hover:border-neutral-700 group-hover:text-neutral-200 transition-colors">
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </div>

            {/* Datos Tipográficos */}
            <div className="flex flex-col">
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400 font-medium">
                {label}
              </span>
              <span className="font-serif text-lg font-semibold text-neutral-100 tracking-tight leading-tight mt-0.5">
                {value}
              </span>
              <span className="text-xs text-neutral-500 font-sans mt-0.5">
                {detail}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
