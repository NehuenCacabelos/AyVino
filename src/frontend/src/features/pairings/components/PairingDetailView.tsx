import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wine,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Layers,
  UtensilsCrossed,
  Sliders,
  Hourglass,
  Flame,
  Check,
} from 'lucide-react';
import type {
  FoodPairingEntity,
  WineVarietyEntity,
  FoodCategoryId,
  WineVarietyId,
} from '../../../data/pairingsData';
import {
  getFoodPairing,
  getWineVariety,
  getCuratedWinesForPairing,
} from '../../../data/pairingsData';
import { WineCard } from '../../wines';
import type { CuratedWine } from '../../../types/wine';

interface PairingDetailViewProps {
  mode: 'food' | 'wine';
  food: FoodPairingEntity;
  wine: WineVarietyEntity;
  onSelectFood: (id: FoodCategoryId) => void;
  onSelectWine: (id: WineVarietyId) => void;
  onOpenWineModal: (wine: CuratedWine) => void;
}

export default function PairingDetailView({
  mode,
  food,
  wine,
  onSelectFood,
  onSelectWine,
  onOpenWineModal,
}: PairingDetailViewProps) {
  const [savedToCava, setSavedToCava] = useState(false);

  const handleSaveToCava = () => {
    setSavedToCava(true);
    setTimeout(() => {
      setSavedToCava(false);
    }, 3200);
  };

  // ==========================================
  // MODO: ¿Qué vas a comer? (FOOD)
  // ==========================================
  if (mode === 'food') {
    const recommendedWines = getCuratedWinesForPairing(food.curatedWineIds);

    return (
      <div className="flex flex-col gap-8 animate-fadeIn">
        {/* Panel Editorial Principal - Diseño traído de Stitch con Halos y Alta Jerarquía */}
        <div className="relative rounded-2xl bg-[#16161C]/95 backdrop-blur-2xl border border-neutral-700/60 p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_0_32px_rgba(114,47,55,0.2)] overflow-hidden">
          {/* Halos Ambientales de Cava */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-950/20 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col gap-8">
            {/* Header: Categoría & Tesis de Maridaje */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-mono text-xs text-amber-300 font-semibold tracking-[0.25em] uppercase">
                    Guía de Maridaje Criollo · {food.badge}
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl text-neutral-100 font-semibold tracking-tight">
                  {food.headline || food.title}
                </h2>

                <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-2xl font-light">
                  {food.sommelierNote}
                </p>
              </div>

              {/* Quick Sommelier Metric Badges */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Principio</span>
                  <span className="font-serif text-sm font-semibold text-neutral-100 truncate">{food.principle}</span>
                </div>
                <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Copa Ideal</span>
                  <span className="font-serif text-sm font-semibold text-amber-200 truncate">{food.glassware.split(' ')[0]} {food.glassware.split(' ')[1] || ''}</span>
                </div>
                <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Temperatura</span>
                  <span className="font-serif text-sm font-semibold text-rose-300">{food.servingTemperature}</span>
                </div>
              </div>
            </div>

            {/* Platos Criollos Sugeridos con Afinidad Enogastronómica */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-medium">
                    Platos representativos ({food.dishes.length}):
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                  {food.affinityNote || 'ALTA AFINIDAD EN GASTRONOMÍA'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {food.dishes.map((dish, idx) => (
                  <div
                    key={dish}
                    className="group relative rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-4 flex flex-col justify-between hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-300 shadow-sm"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#722F37]/20 border border-rose-500/30 text-rose-300 uppercase">
                          Receta #{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          9{8 - idx}% AFINIDAD
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-semibold text-neutral-100 group-hover:text-white transition-colors mt-1">
                        {dish}
                      </h4>
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed line-clamp-2">
                        Armonización recomendada por sommeliers de Cuyo y el Noroeste Argentino para este estilo.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>{food.badge.split('&')[0] || 'Criollo'}</span>
                      <span className="text-rose-400 flex items-center gap-1">
                        Corte ideal <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matriz Sensorial & Cristalería + Llamado de Acción */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Cepas Recomendadas */}
              <div className="lg:col-span-7 rounded-xl bg-neutral-900/60 border border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-neutral-200 font-semibold">
                      Cepas recomendadas para {food.title}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 font-sans">
                    Hacé clic en cualquier cepa para ver su perfil enológico y notas de cata:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                    {food.recommendedVarieties.map((varId) => {
                      const variety = getWineVariety(varId);
                      if (!variety) return null;

                      return (
                        <button
                          key={varId}
                          type="button"
                          onClick={() => onSelectWine(varId)}
                          className="group flex items-center justify-between p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-600 hover:bg-[#181820] text-left transition-all duration-200 cursor-pointer shadow-sm"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-serif text-sm font-semibold text-neutral-100 group-hover:text-white transition-colors">
                              {variety.title}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-400 group-hover:text-amber-200/90 transition-colors">
                              {variety.body} · Acidez {variety.acidity}
                            </span>
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consejos de Servicio */}
                <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center gap-5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="text-neutral-400">Copa:</span>
                    <span className="font-medium text-neutral-100">{food.glassware}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-neutral-300">{food.serviceTip}</span>
                  </div>
                </div>
              </div>

              {/* Acciones & Guardado en Cava */}
              <div className="lg:col-span-5 rounded-xl bg-neutral-900/60 border border-neutral-800 p-6 flex flex-col justify-between gap-4 shadow-sm">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs uppercase tracking-widest text-amber-300 font-semibold">
                    ¿Querés probar este maridaje hoy?
                  </span>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Guardá esta guía en tu Cava personal para consultarla cuando cocines o explorá las etiquetas sugeridas en el catálogo.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToCava}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md ${
                      savedToCava
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-amber-400/20'
                        : 'bg-[#722F37] hover:bg-[#5c1d24] text-white shadow-rose-950/40'
                    }`}
                  >
                    {savedToCava ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Guardado en tu Cava!</span>
                      </>
                    ) : (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Guardar en Mi Cava</span>
                      </>
                    )}
                  </button>

                  <Link
                    to="/catalogo"
                    className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-neutral-700 font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <span>Ver Catálogo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Botellas Curadas del Catálogo */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
                CURADURÍA DE CAVA
              </span>
              <h4 className="font-serif text-2xl font-semibold text-neutral-100">
                Etiquetas recomendadas para este maridaje
              </h4>
            </div>

            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recommendedWines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedWines.map((wineItem) => (
                <WineCard
                  key={wineItem.id}
                  wine={wineItem}
                  onSelect={onOpenWineModal}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#16161c]/95 backdrop-blur-md border border-neutral-700/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-14 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center shrink-0 text-rose-400">
                  <Wine className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-serif text-lg font-semibold text-neutral-100">
                    Catálogo Boutique AyVino
                  </h5>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                    Contamos con más de 40 etiquetas boutique y partidas limitadas de autor que armonizan con este estilo gastronómico.
                  </p>
                </div>
              </div>

              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-[#722F37] hover:bg-[#5c1d24] text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all shrink-0 shadow-lg shadow-rose-950/50"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODO: ¿Qué vas a tomar? (WINE)
  // ==========================================
  const recommendedWines = getCuratedWinesForPairing(wine.curatedWineIds);

  const tanninsVal = wine.tanninsScore ?? (wine.wineType === 'Tinto' ? 7.0 : 0);
  const acidityVal = wine.acidityScore ?? 7.5;
  const bodyVal = wine.bodyScore ?? (wine.body === 'Ligero' ? 5.0 : wine.body === 'Medio' ? 7.0 : 8.5);

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Panel Editorial Principal - Diseño traído de Stitch con Halos y Matriz Sensorial */}
      <div className="relative rounded-2xl bg-[#16161C]/95 backdrop-blur-2xl border border-neutral-700/60 p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_0_32px_rgba(114,47,55,0.2)] overflow-hidden">
        {/* Halos Ambientales de Cava */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-950/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 blur-[90px] pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col gap-8">
          {/* Header: Cepa & Tesis de Maridaje */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono text-xs text-amber-300 font-semibold tracking-[0.25em] uppercase">
                  Maridaje Recomendado para {wine.title} Argentina
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl text-neutral-100 font-semibold tracking-tight">
                {wine.headline || wine.title}
              </h2>

              <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-2xl font-light">
                {wine.sommelierNote}
              </p>
            </div>

            {/* Quick Sommelier Metric Badges */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Cuerpo</span>
                <span className="font-serif text-sm font-semibold text-neutral-100">{wine.body}</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Acidez</span>
                <span className="font-serif text-sm font-semibold text-amber-200">{wine.acidity}</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1 min-w-[110px] shadow-sm">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Temperatura</span>
                <span className="font-serif text-sm font-semibold text-rose-300">{wine.servingTemperature}</span>
              </div>
            </div>
          </div>

          {/* Maridajes Gastronómicos Argentinos Destacados para esta Cepa */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-medium">
                  Categorías Gastronómicas Ideales:
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                SELECCIONÁ PARA VER EL MENÚ COMPLETO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wine.recommendedFoods.map((foodId, idx) => {
                const foodCat = getFoodPairing(foodId);
                if (!foodCat) return null;

                return (
                  <button
                    key={foodId}
                    type="button"
                    onClick={() => onSelectFood(foodId)}
                    className="group relative rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-5 flex flex-col justify-between hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300 text-left cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 uppercase">
                          {foodCat.badge.split('&')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {98 - idx * 2}% AFINIDAD
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-neutral-100 group-hover:text-amber-200 transition-colors">
                        {foodCat.title}
                      </h3>

                      <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                        {foodCat.dishes.slice(0, 3).join(', ')}...
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>{foodCat.principle}</span>
                      <span className="text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Ver platos <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matriz Sensorial de la Cepa & Sliders de Medición */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Matriz Sensorial */}
            <div className="lg:col-span-7 rounded-xl bg-neutral-900/60 border border-neutral-800 p-6 flex flex-col justify-between gap-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs uppercase tracking-wider text-neutral-200 font-semibold">
                    Matriz Sensorial de la Cepa
                  </span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                  Equilibrio en Copa
                </span>
              </div>

              {/* Sliders visuales de Medición Sensorial */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Taninos (solo para tintos) */}
                {wine.wineType === 'Tinto' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="text-neutral-400 uppercase">Taninos</span>
                      <span className="text-neutral-200 font-bold">{tanninsVal.toFixed(1)} / 10</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${tanninsVal * 10}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-sans text-neutral-400 truncate">
                      {wine.tannins || 'Sedosos'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="text-neutral-400 uppercase">Frescura</span>
                      <span className="text-neutral-200 font-bold">9.0 / 10</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                    <span className="text-[11px] font-sans text-neutral-400">
                      Crocante y limpia
                    </span>
                  </div>
                )}

                {/* Acidez */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-neutral-400 uppercase">Acidez</span>
                    <span className="text-amber-300 font-bold">{acidityVal.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${acidityVal * 10}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-sans text-neutral-400 truncate">
                    {wine.acidity}
                  </span>
                </div>

                {/* Cuerpo / Madera */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-neutral-400 uppercase">Cuerpo</span>
                    <span className="text-neutral-200 font-bold">{bodyVal.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-neutral-400 rounded-full transition-all duration-500"
                      style={{ width: `${bodyVal * 10}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-sans text-neutral-400 truncate">
                    {wine.body}
                  </span>
                </div>
              </div>

              {/* Copa y Potencial de Guarda */}
              <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center gap-6 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <Wine className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-neutral-400">Copa recomendada:</span>
                  <span className="font-medium text-neutral-100">{wine.glassware}</span>
                </div>
                {wine.agingPotential && (
                  <div className="flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-neutral-400">Potencial de guarda:</span>
                    <span className="font-medium text-neutral-100">{wine.agingPotential}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones & Guardado en Cava */}
            <div className="lg:col-span-5 rounded-xl bg-neutral-900/60 border border-neutral-800 p-6 flex flex-col justify-between gap-4 shadow-sm">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-widest text-amber-300 font-semibold">
                  ¿Querés probar este maridaje hoy?
                </span>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Agregá esta guía a tu perfil privado o explorá las etiquetas de {wine.title} mejor puntuadas por sommeliers locales.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToCava}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md ${
                    savedToCava
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow-amber-400/20'
                      : 'bg-[#722F37] hover:bg-[#5c1d24] text-white shadow-rose-950/40'
                  }`}
                >
                  {savedToCava ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Guardado en tu Cava!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Guardar en Mi Cava</span>
                    </>
                  )}
                </button>

                <Link
                  to="/catalogo"
                  className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-neutral-700 font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <span>Ver Catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Etiquetas Recomendadas */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
              COLECCIÓN CERTIFICADA
            </span>
            <h4 className="font-serif text-2xl font-semibold text-neutral-100">
              Etiquetas de {wine.title} en AyVino
            </h4>
          </div>

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>Explorar más en Catálogo</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recommendedWines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedWines.map((wineItem) => (
              <WineCard
                key={wineItem.id}
                wine={wineItem}
                onSelect={onOpenWineModal}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#16161c]/95 backdrop-blur-md border border-neutral-700/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-14 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center shrink-0 text-rose-400">
                <Wine className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-serif text-lg font-semibold text-neutral-100">
                  Etiquetas de {wine.title}
                </h5>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                  Contamos con diversas partidas limitadas de {wine.title} y bodegas boutique en nuestro catálogo abierto.
                </p>
              </div>
            </div>

            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#722F37] hover:bg-[#5c1d24] text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all shrink-0 shadow-lg shadow-rose-950/50"
            >
              <span>Ver en Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
