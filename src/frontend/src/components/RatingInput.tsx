import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { formatRating, normalizeRating } from '../lib/formatRating';

export interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  allowClear?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
  helperText?: string;
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
}

export function FractionalStar({ fillPercent, size = 'w-4 h-4' }: { fillPercent: number; size?: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(fillPercent)));
  return (
    <div className={`relative inline-block ${size} text-neutral-700`}>
      <Star className={`${size} text-neutral-700`} />
      {percent > 0 && (
        <div
          className="absolute top-0 left-0 overflow-hidden h-full text-amber-400 fill-amber-400"
          style={{ width: `${percent}%` }}
        >
          <Star className={`${size} fill-amber-400 text-amber-400`} />
        </div>
      )}
    </div>
  );
}

export default function RatingInput({
  value,
  onChange,
  min = 1.0,
  max = 5.0,
  step = 0.1,
  allowClear = true,
  disabled = false,
  id = 'rating-input-range',
  label = 'Calificación organoléptica',
  helperText = 'Deslizá con precisión de décimas',
  ariaLabel = 'Seleccionar puntuación decimal',
  className = '',
  compact = false,
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating ?? value;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = parseFloat(e.target.value);
    const clamped = Math.min(max, Math.max(min, rawVal));
    onChange(normalizeRating(clamped));
  };

  const handleStarClick = (starIndex: number) => {
    if (disabled) return;
    onChange(normalizeRating(starIndex));
  };

  const handleClear = () => {
    if (disabled) return;
    setHoverRating(null);
    onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const current = value ?? min;
      const next = Math.min(max, normalizeRating(current + step));
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const current = value ?? min;
      const next = Math.max(min, normalizeRating(current - step));
      onChange(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (allowClear) {
        e.preventDefault();
        handleClear();
      }
    }
  };

  return (
    <div
      className={`space-y-2 bg-[#0a0a0c]/60 p-4 rounded-lg border border-neutral-800/60 ${className}`}
      data-testid="rating-input-container"
    >
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-mono text-neutral-400 uppercase tracking-wider block">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {value !== null ? (
            <span
              className="font-mono text-sm text-amber-300 font-bold"
              data-testid="rating-display-value"
            >
              {formatRating(displayRating)} / {formatRating(max)} ★
            </span>
          ) : (
            <span
              className="font-mono text-xs text-neutral-500 italic"
              data-testid="rating-display-unrated"
            >
              Sin calificar
            </span>
          )}

          {allowClear && value !== null && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar puntuación"
              title="Quitar puntuación"
              className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-sm text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitar</span>
            </button>
          )}
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 pt-1"
        onMouseLeave={() => setHoverRating(null)}
      >
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={`Calificación de ${min} a ${max} estrellas`}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const currentVal = displayRating ?? 0;
            const fillPercent = Math.max(0, Math.min(1, currentVal - (starIndex - 1))) * 100;
            return (
              <button
                key={starIndex}
                type="button"
                disabled={disabled}
                onClick={() => handleStarClick(starIndex)}
                onMouseEnter={() => !disabled && setHoverRating(starIndex)}
                className={`p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 transition-transform ${
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110'
                }`}
                aria-label={`${starIndex} de ${max} estrellas`}
              >
                <FractionalStar fillPercent={fillPercent} size={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-neutral-500 select-none">
          {helperText}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        disabled={disabled}
        onChange={handleSliderChange}
        onKeyDown={handleKeyDown}
        className="w-full accent-rose-700 h-1.5 bg-neutral-800 rounded-lg cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={ariaLabel}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value !== null ? `${formatRating(value)} estrellas` : 'Sin calificar'}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  );
}
