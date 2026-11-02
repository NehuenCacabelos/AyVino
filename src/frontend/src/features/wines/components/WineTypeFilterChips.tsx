interface WineTypeOption {
  label: string;
  value: string;
}

const WINE_TYPE_CHIP_OPTIONS: WineTypeOption[] = [
  { label: 'Todos', value: '' },
  { label: 'Tinto', value: 'Red' },
  { label: 'Blanco', value: 'White' },
  { label: 'Rosado', value: 'Rose' },
  { label: 'Espumoso', value: 'Sparkling' },
  { label: 'Naranjo', value: 'Orange' },
];

interface WineTypeFilterChipsProps {
  activeType?: string;
  onSelectType: (typeValue: string) => void;
}

/**
 * WineTypeFilterChips Component
 * Chips de filtrado rápido por categoría de vino para el catálogo general.
 * Reutiliza la estética editorial mate de FilterChips sin modificar el dashboard.
 */
export default function WineTypeFilterChips({
  activeType = '',
  onSelectType,
}: WineTypeFilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filtro por tipo de vino"
      className="flex flex-wrap items-center gap-2"
    >
      {WINE_TYPE_CHIP_OPTIONS.map((option) => {
        const isSelected = activeType === option.value;

        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectType(option.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              isSelected
                ? 'bg-rose-950/40 border border-rose-700/60 text-rose-200 shadow-sm'
                : 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
