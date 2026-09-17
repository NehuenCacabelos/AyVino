import { useState } from 'react';
import { Star, Heart, MapPin, Wine as WineIcon, Sparkles, CheckCircle, Info } from 'lucide-react';
import type { CuratedWine } from '../../types/wine';

interface WineCardProps {
  wine: CuratedWine;
  onSelect?: (wine: CuratedWine) => void;
}

/**
 * WineCard Component
 * Tarjeta de vino editorial, minimalista y con micro-interacciones suaves.
 * Muestra información del terroir, notas de cata sensoriales, precio orientativo
 * y badge de procedencia (Oficial vs Comunidad).
 */
export default function WineCard({ wine, onSelect }: WineCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const {
    name,
    winery,
    grape,
    vintage,
    region,
    tastingNotes,
    price,
    rating,
    reviewCount,
    isOfficial,
    colorAccent = 'from-wine-900/10 to-wine-500/5',
  } = wine;

  return (
    <article className="group relative bg-cream-50 rounded-2xl border border-cream-200/90 hover:border-wine-800/30 transition-all duration-300 hover:shadow-xl hover:shadow-wine-950/5 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
      
      {/* Header visual con gradiente tenue y badges */}
      <div className={`relative p-5 pb-3 bg-gradient-to-b ${colorAccent} border-b border-cream-200/50`}>
        <div className="flex items-center justify-between gap-2">
          
          {/* Badge de Cepa & Añada */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-50/90 text-wine-900 border border-cream-200 shadow-2xs">
              {grape}
            </span>
            <span className="text-xs font-semibold text-earth-900/60 font-mono">
              {vintage}
            </span>
          </div>

          {/* Botón rápido de Favorito / Me Gusta */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLiked
                ? 'text-wine-500 bg-wine-50'
                : 'text-earth-900/40 hover:text-wine-800 hover:bg-cream-100'
            }`}
            aria-label={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Micro-badge de autenticidad */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-earth-900/60 uppercase">
            {winery}
          </span>
          {isOfficial ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              Bodega Oficial
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Comunidad
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo principal de la tarjeta */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Nombre del vino */}
          <h4 className="font-serif text-xl font-bold text-earth-900 group-hover:text-wine-900 transition-colors leading-tight">
            {name}
          </h4>

          {/* Ubicación / Terroir */}
          <div className="flex items-center gap-1.5 text-xs text-earth-900/60 mt-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-wine-800/70 shrink-0" />
            <span className="truncate">{region}</span>
          </div>

          {/* Notas de cata breves */}
          <div className="relative mt-2 p-3 bg-cream-100/70 rounded-xl border border-cream-200/60">
            <div className="flex items-start gap-2">
              <WineIcon className="w-4 h-4 text-wine-800 shrink-0 mt-0.5" />
              <p className="text-xs text-earth-900/80 italic leading-relaxed">
                "{tastingNotes}"
              </p>
            </div>
          </div>
        </div>

        {/* Valoración & Reseñas */}
        <div className="mt-4 pt-3 border-t border-cream-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-sm font-bold text-earth-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-earth-900/50">({reviewCount})</span>
          </div>

          {/* Precio orientativo */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-earth-900/50 block">
              Precio ref.
            </span>
            <span className="font-mono text-sm font-semibold text-wine-900">
              ${price.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

      </div>

      {/* Footer de acción sin bloqueo */}
      <div className="px-5 pb-4 pt-1 bg-cream-50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect?.(wine)}
          className="w-full py-2 px-3 text-xs font-medium text-earth-900 hover:text-wine-900 bg-cream-100/90 hover:bg-cream-200/90 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-wine-800" />
          <span>Ver ficha de cata completa</span>
        </button>
      </div>

    </article>
  );
}

