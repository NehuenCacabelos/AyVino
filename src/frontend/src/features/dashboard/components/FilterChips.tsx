import { useState } from 'react';

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
 */
export default function FilterChips({
  activeChip = 'Todos',
  onSelectChip,
}: FilterChipsProps) {
  const [selected, setSelected] = useState(activeChip);

  const handleSelect = (chip: string) => {
    setSelected(chip);
    onSelectChip?.(chip);
  };

  return (
    <div
      role="group"
      aria-label="Filtros rápidos del catálogo"
      className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto"
    >
      {chips.map((chip, i) => (
        <span key={chip} className="flex items-center gap-2">
          {i === 5 && (
            <span
              className="mx-1 h-4 w-px bg-neutral-800 hidden sm:inline-block"
              aria-hidden="true"
            />
          )}
          <button
            type="button"
            aria-pressed={selected === chip}
            onClick={() => handleSelect(chip)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              selected === chip
                ? 'bg-[#722F37] text-neutral-100 shadow-sm border border-[#722F37]'
                : 'border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-100'
            }`}
          >
            {chip}
          </button>
        </span>
      ))}
    </div>
  );
}
