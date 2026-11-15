import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { GrapeResponseDto } from '../../winery/types';

export interface VarietalGrapeComboboxProps {
  grapes: GrapeResponseDto[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectGrape: (grape: GrapeResponseDto) => void;
  selectedGrapeIds?: (number | '')[];
  placeholder?: string;
  disabled?: boolean;
}

export default function VarietalGrapeCombobox({
  grapes,
  searchQuery,
  onSearchChange,
  onSelectGrape,
  selectedGrapeIds = [],
  placeholder = 'Buscar uva...',
  disabled = false,
}: VarietalGrapeComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const list = Array.isArray(grapes) ? grapes : [];

  const handleSelect = (grape: GrapeResponseDto) => {
    onSelectGrape(grape);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (list.length === 0) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < list.length) {
        handleSelect(list[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="varietal-grape-listbox"
        aria-activedescendant={
          isOpen && activeIndex >= 0 && list[activeIndex]
            ? `varietal-grape-opt-${activeIndex}`
            : undefined
        }
        disabled={disabled}
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
            setActiveIndex(0);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-[#121015] border border-neutral-700 rounded pl-8 pr-2.5 py-1.5 text-xs font-mono text-neutral-200 focus:border-rose-500 focus:outline-none placeholder:text-neutral-500"
        aria-label="Buscar uva"
      />

      {isOpen && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          id="varietal-grape-listbox"
          aria-label="Catálogo de uvas"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-white/[0.12] bg-[#141417]/95 backdrop-blur-xl shadow-2xl divide-y divide-white/[0.06]"
        >
          {list.length === 0 ? (
            <li className="p-3 text-xs text-neutral-400 text-center font-mono">
              No se encontraron uvas con ese nombre
            </li>
          ) : (
            list.map((grape, idx) => {
              const isSelected = selectedGrapeIds.includes(grape.id);
              const isHighlighted = idx === activeIndex;
              return (
                <li
                  key={grape.id}
                  role="option"
                  id={`varietal-grape-opt-${idx}`}
                  aria-selected={isHighlighted || isSelected}
                  onClick={() => handleSelect(grape)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-2.5 cursor-pointer text-left transition-colors flex items-center justify-between text-xs ${
                    isHighlighted
                      ? 'bg-white/[0.08] text-white'
                      : 'text-neutral-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="font-medium font-mono">{grape.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-1.5 py-0.5 rounded capitalize">
                    {grape.colorType || 'Otro'}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
