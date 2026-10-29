const chips = [
  'Todos',
  'Malbec',
  'Cabernet Sauvignon',
  'Blancos',
  'Espumantes',
  'Mendoza',
  'Salta',
  'Patagonia',
];

interface FilterChipsProps {
  activeChip?: string;
  onSelectChip?: (chip: string) => void;
}

/**
 * FilterChips Component (Estética Oscura Mate)
 * Botones de filtrado rápido con estilo píldora discreto, fondo neutral-900/60,
 * bordes border-neutral-800 y estado activo en bordó #722F37.
 * Componente 100% controlado: el estado reside en la Fuente Única de Verdad del contenedor padre.
 */
export default function FilterChips({
  activeChip = 'Todos',
  onSelectChip,
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filtros rápidos del catálogo"
      className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto"
    >
      {chips.map((chip, i) => {
        const isSelected = activeChip === chip;

        return (
          <span key={chip} className="flex items-center gap-2">
            {i === 5 && (
              <span
                className="mx-1 h-4 w-px bg-neutral-800 hidden sm:inline-block"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectChip?.(chip)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-950/40 border border-rose-700/60 text-rose-200 shadow-sm'
                  : 'border border-white/[0.08] hover:border-white/[0.16] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {chip}
            </button>
          </span>
        );
      })}
    </div>
  );
}
