import { Wine, Clock, Layers, Award, type LucideIcon } from 'lucide-react';

interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  hasOptimalIndicator?: boolean;
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
 * Metrics Component (Grid de Cards Flotantes de KPIs)
 * Rediseño desacoplado del monolito con estética limpia y moderna:
 * - Grid flotante a 4 columnas (2 en mobile): grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-4
 * - Tarjetas individuales con fondo translúcido, borde suave y hover reactivo:
 *   bg-stone-900/40 backdrop-blur-sm hover:bg-stone-900/60 border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20
 * - Chip circular para íconos: w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-stone-300
 * - Título uppercase sutil (text-xs font-medium tracking-wider text-stone-400 uppercase)
 * - Valor destacado en serif (text-2xl font-serif text-white mt-3)
 * - Subtítulo / detalle (text-xs text-stone-500 mt-1) con indicador esmeralda en "Listas para tomar"
 */
export default function Metrics({ customStats }: MetricsProps) {
  const stats: MetricItem[] = [
    {
      id: 'total',
      label: 'Total en Cava',
      value: `${customStats?.bottles ?? 24} Botellas`,
      detail: 'Listas para descorchar',
      icon: Wine,
    },
    {
      id: 'ready',
      label: 'Listas para tomar',
      value: `${customStats?.readyToDrink ?? 3} Botellas`,
      detail: 'En ventana óptima',
      icon: Clock,
      hasOptimalIndicator: true,
    },
    {
      id: 'varietal',
      label: 'Varietal dominante',
      value: customStats?.dominantVarietal ?? 'Malbec (58%)',
      detail: '8 cepas en inventario',
      icon: Layers,
    },
    {
      id: 'rating',
      label: 'Valoración promedio',
      value: customStats?.topRated ?? '4.8 / 5.0 ★',
      detail: 'Nivel Gran Reserva',
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
      {stats.map(({ id, label, value, detail, icon: Icon, hasOptimalIndicator }) => (
        <article
          key={id}
          className="bg-stone-900/40 backdrop-blur-sm hover:bg-stone-900/60 transition-all duration-300 border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between"
        >
          {/* Encabezado: Ícono en chip circular tenue junto al título pequeño en mayúsculas */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-stone-300 shrink-0">
              <Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="text-xs font-medium tracking-wider text-stone-400 uppercase">
              {label}
            </span>
          </div>

          {/* Cuerpo: Valor principal destacado y Subtítulo / Detalle */}
          <div>
            <p className="text-2xl font-serif text-white mt-3">
              {value}
            </p>
            <p className="text-xs text-stone-500 mt-1 flex items-center">
              {hasOptimalIndicator && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-emerald-500/80 mr-1.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{detail}</span>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
