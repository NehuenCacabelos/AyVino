import { Link } from 'react-router-dom';
import {
  Thermometer,
  Wine,
  Sparkles,
  ArrowRight,
  Flame,
  ChefHat,
  Bookmark,
  Layers,
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
  if (mode === 'food') {
    const recommendedWines = getCuratedWinesForPairing(food.curatedWineIds);

    return (
      <div className="flex flex-col gap-8 animate-fadeIn">
        {/* Cabecera Editorial de la Comida */}
        <div className="bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 relative overflow-hidden shadow-xl">
          {/* Acento de luz ambiental */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#722F37]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#240e15] border border-rose-900/40 text-rose-300 font-mono text-[11px] uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                {food.badge}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Principio: {food.principle}
              </span>
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
              {food.title}
            </h3>

            {/* Platos de Referencia */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
                Platos representativos:
              </span>
              {food.dishes.map((dish) => (
                <span
                  key={dish}
                  className="px-2.5 py-1 rounded-md bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs font-sans"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ficha Sommelier: Análisis Organoléptico & Pautas Técnicas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Análisis de Afinidades (7 cols) */}
          <div className="lg:col-span-7 bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-900/40 text-rose-300">
                  <ChefHat className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 block">
                    CIENCIA DEL MARIDAJE
                  </span>
                  <h4 className="font-serif text-xl font-semibold text-neutral-100">
                    Fundamentación del Sommelier
                  </h4>
                </div>
              </div>

              <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-300 font-sans font-light">
                {food.sommelierNote}
              </p>
            </div>

            {/* Tips de Servicio */}
            <div className="mt-6 pt-6 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-neutral-900/60 rounded-xl p-3.5 border border-neutral-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 mt-0.5">
                  <Thermometer className="h-4 w-4 text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    Temperatura Óptima
                  </span>
                  <span className="text-xs font-mono font-semibold text-neutral-200 mt-0.5">
                    {food.servingTemperature}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-neutral-900/60 rounded-xl p-3.5 border border-neutral-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 mt-0.5">
                  <Wine className="h-4 w-4 text-amber-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    Cristalería Sugerida
                  </span>
                  <span className="text-xs font-sans font-medium text-neutral-300 mt-0.5 line-clamp-2">
                    {food.glassware}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60 p-3.5 text-xs text-neutral-400 font-sans flex items-start gap-2.5">
              <Bookmark className="w-4 h-4 text-rose-400/80 shrink-0 mt-0.5" />
              <span>{food.serviceTip}</span>
            </div>
          </div>

          {/* Columna Derecha: Cepas Sugeridas (Navegación Cruzada a "¿Qué vas a tomar?") (5 cols) */}
          <div className="lg:col-span-5 bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 block">
                    ARMONÍA ENOLÓGICA
                  </span>
                  <h4 className="font-serif text-xl font-semibold text-neutral-100">
                    Cepas Ideales
                  </h4>
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                Hacé clic en cualquier cepa para cambiar de perspectiva y consultar su ficha organoléptica detallada:
              </p>

              {/* Botones de Cepas con salto interactivo */}
              <div className="flex flex-col gap-2.5 mt-1">
                {food.recommendedVarieties.map((varId) => {
                  const variety = getWineVariety(varId);
                  if (!variety) return null;

                  return (
                    <button
                      key={varId}
                      type="button"
                      onClick={() => onSelectWine(varId)}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-rose-900/60 hover:bg-neutral-900 text-left transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                            {variety.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase">
                            {variety.wineType}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 line-clamp-1">
                          {variety.body} · Acidez {variety.acidity}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-neutral-500 group-hover:text-rose-400 transition-colors">
                        <span>Ver cepa</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Botellas Sugeridas del Catálogo / Cava */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
                CURADURÍA DE CAVA
              </span>
              <h4 className="font-serif text-2xl font-semibold text-neutral-100">
                Etiquetas Recomendadas para este Maridaje
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
            <div className="rounded-xl bg-[#141417] border border-neutral-800 p-8 text-center flex flex-col items-center justify-center gap-3">
              <Wine className="w-8 h-8 text-neutral-600" />
              <div className="max-w-md">
                <p className="text-sm text-neutral-300 font-medium">
                  Contamos con más de 40 etiquetas boutique afines a este estilo en nuestro catálogo.
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Filtrá por tipo de vino o cepa sugerida para descubrir bodegas de autor ideales.
                </p>
              </div>
              <Link
                to="/catalogo"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#722F37] hover:bg-[#5c1d24] text-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
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

  // MODO: ¿Qué vas a tomar? (WINE)
  const recommendedWines = getCuratedWinesForPairing(wine.curatedWineIds);

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Cabecera Editorial del Vino */}
      <div className="bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#722F37]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#240e15] border border-rose-900/40 text-rose-300 font-mono text-[11px] uppercase tracking-wider">
                <Wine className="w-3.5 h-3.5 text-rose-400" />
                {wine.wineType}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px] uppercase tracking-wider">
                Cuerpo: {wine.body}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
              Acidez: {wine.acidity}
            </span>
          </div>

          <h3 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
            {wine.title}
          </h3>

          {/* Descriptores Aromáticos */}
          <div className="rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-4 mt-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Perfil Aromático y Descriptores:
            </span>
            <p className="text-sm font-sans text-neutral-200">
              {wine.flavorProfile}
            </p>
          </div>
        </div>
      </div>

      {/* Ficha Sommelier: Enfoque Enológico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Criterio Sommelier (7 cols) */}
        <div className="lg:col-span-7 bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-900/40 text-rose-300">
                <ChefHat className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 block">
                  ANÁLISIS ENOLÓGICO
                </span>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  Comportamiento en Mesa
                </h4>
              </div>
            </div>

            <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-300 font-sans font-light">
              {wine.sommelierNote}
            </p>

            {wine.tannins && (
              <div className="flex items-center gap-2 pt-1 text-xs font-mono text-neutral-400">
                <span className="text-neutral-500 uppercase">Textura tánica:</span>
                <span className="text-neutral-200">{wine.tannins}</span>
              </div>
            )}
          </div>

          {/* Pautas de Servicio */}
          <div className="mt-6 pt-6 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-neutral-900/60 rounded-xl p-3.5 border border-neutral-800/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 mt-0.5">
                <Thermometer className="h-4 w-4 text-rose-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Temperatura
                </span>
                <span className="text-xs font-mono font-semibold text-neutral-200 mt-0.5">
                  {wine.servingTemperature}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-neutral-900/60 rounded-xl p-3.5 border border-neutral-800/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 mt-0.5">
                <Wine className="h-4 w-4 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Copa Recomendada
                </span>
                <span className="text-xs font-sans font-medium text-neutral-300 mt-0.5">
                  {wine.glassware}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60 p-3.5 text-xs text-neutral-400 font-sans flex items-start gap-2.5">
            <Bookmark className="w-4 h-4 text-rose-400/80 shrink-0 mt-0.5" />
            <span>{wine.serviceTip}</span>
          </div>
        </div>

        {/* Columna Derecha: Comidas Recomendadas (Navegación Cruzada a "¿Qué vas a comer?") (5 cols) */}
        <div className="lg:col-span-5 bg-[#141417] rounded-2xl border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                <Flame className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 block">
                  MARIDAJE GASTRONÓMICO
                </span>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  Platos & Cocinas Ideales
                </h4>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Hacé clic en cualquier categoría culinaria para explorar su análisis molecular y preparaciones recomendadas:
            </p>

            <div className="flex flex-col gap-2.5 mt-1">
              {wine.recommendedFoods.map((foodId) => {
                const foodCat = getFoodPairing(foodId);
                if (!foodCat) return null;

                return (
                  <button
                    key={foodId}
                    type="button"
                    onClick={() => onSelectFood(foodId)}
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-rose-900/60 hover:bg-neutral-900 text-left transition-all cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-serif text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                        {foodCat.title}
                      </span>
                      <span className="text-xs text-neutral-400 line-clamp-1">
                        {foodCat.dishes.slice(0, 3).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-neutral-500 group-hover:text-rose-400 transition-colors">
                      <span>Ver platos</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
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
          <div className="rounded-xl bg-[#141417] border border-neutral-800 p-8 text-center flex flex-col items-center justify-center gap-3">
            <Wine className="w-8 h-8 text-neutral-600" />
            <div className="max-w-md">
              <p className="text-sm text-neutral-300 font-medium">
                Contamos con diversas partidas limitadas de {wine.title} en nuestro catálogo público.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Descubrí bodegas boutique de diferentes regiones y altitudes argentinas.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#722F37] hover:bg-[#5c1d24] text-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              <span>Ver {wine.title} en Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

