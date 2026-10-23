import { Link } from 'react-router-dom';
import {
  Thermometer,
  Wine,
  ArrowRight,
  ChefHat,
  Bookmark,
  Layers,
  UtensilsCrossed,
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
        <div className="bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col gap-4">
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-100">
              {food.title}
            </h3>

            {/* Platos de Referencia */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
                Platos sugeridos:
              </span>
              {food.dishes.map((dish) => (
                <span
                  key={dish}
                  className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-sans"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ficha Sommelier: Por qué funciona & Cepas Sugeridas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Por qué funciona (7 cols) */}
          <div className="lg:col-span-7 bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-950/40 border border-rose-900/40 text-rose-300">
                  <ChefHat className="h-4 w-4" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  Por qué funciona
                </h4>
              </div>

              <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-300 font-sans font-light">
                {food.sommelierNote}
              </p>
            </div>

            {/* Barra Compacta de Servicio: Temperatura, Cristalería y Tip */}
            <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-neutral-500 font-mono">Temp:</span>
                <span className="font-mono font-medium text-neutral-200">{food.servingTemperature}</span>
              </div>

              <span className="hidden sm:inline text-neutral-700">|</span>

              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-amber-300 shrink-0" />
                <span className="text-neutral-500 font-mono">Copa:</span>
                <span className="font-sans text-neutral-200">{food.glassware}</span>
              </div>

              <span className="hidden sm:inline text-neutral-700">|</span>

              <div className="flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-rose-400/80 shrink-0" />
                <span className="text-neutral-400 font-sans">{food.serviceTip}</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Cepas Sugeridas (5 cols) */}
          <div className="lg:col-span-5 bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Layers className="h-4 w-4" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  Cepas recomendadas
                </h4>
              </div>

              <p className="text-xs text-neutral-400">
                Hacé clic en cualquier cepa para ver su perfil enológico y notas de cata:
              </p>

              {/* Botones de Cepas sin badge redundante de tipo */}
              <div className="flex flex-col gap-2.5 mt-1">
                {food.recommendedVarieties.map((varId) => {
                  const variety = getWineVariety(varId);
                  if (!variety) return null;

                  return (
                    <button
                      key={varId}
                      type="button"
                      onClick={() => onSelectWine(varId)}
                      className="group flex items-center justify-between p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90 text-left transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-serif text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                          {variety.title}
                        </span>
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

        {/* Sección de Botellas Sugeridas del Catálogo */}
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
            <div className="rounded-lg bg-[#121215] border border-neutral-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-14 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-rose-400">
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
                className="inline-flex items-center gap-2 rounded-md bg-[#722F37] hover:bg-[#5c1d24] text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all shrink-0 shadow-sm"
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
      <div className="bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-rose-300 font-mono text-xs uppercase tracking-wider">
              {wine.wineType}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider">
              Cuerpo: {wine.body}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-xs uppercase tracking-wider">
              Acidez: {wine.acidity}
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-100">
            {wine.title}
          </h3>

          {/* Descriptores Aromáticos */}
          <div className="rounded-md bg-neutral-900/70 border border-neutral-800/80 p-4 mt-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Perfil Aromático:
            </span>
            <p className="text-sm font-sans text-neutral-200">
              {wine.flavorProfile}
            </p>
          </div>
        </div>
      </div>

      {/* Ficha Sommelier: Por qué funciona & Platos Sugeridos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Por qué funciona (7 cols) */}
        <div className="lg:col-span-7 bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-950/40 border border-rose-900/40 text-rose-300">
                <ChefHat className="h-4 w-4" />
              </div>
              <h4 className="font-serif text-xl font-semibold text-neutral-100">
                Por qué funciona
              </h4>
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

          {/* Barra Compacta de Servicio: Temperatura, Cristalería y Tip */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-neutral-500 font-mono">Temp:</span>
              <span className="font-mono font-medium text-neutral-200">{wine.servingTemperature}</span>
            </div>

            <span className="hidden sm:inline text-neutral-700">|</span>

            <div className="flex items-center gap-2">
              <Wine className="h-4 w-4 text-amber-300 shrink-0" />
              <span className="text-neutral-500 font-mono">Copa:</span>
              <span className="font-sans text-neutral-200">{wine.glassware}</span>
            </div>

            <span className="hidden sm:inline text-neutral-700">|</span>

            <div className="flex items-center gap-2">
              <Bookmark className="h-3.5 w-3.5 text-rose-400/80 shrink-0" />
              <span className="text-neutral-400 font-sans">{wine.serviceTip}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Platos Sugeridos (5 cols) */}
        <div className="lg:col-span-5 bg-[#121215] rounded-lg border border-neutral-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                <UtensilsCrossed className="h-4 w-4 text-neutral-300" />
              </div>
              <h4 className="font-serif text-xl font-semibold text-neutral-100">
                Platos recomendados
              </h4>
            </div>

            <p className="text-xs text-neutral-400">
              Hacé clic en cualquier categoría para explorar sus platos y preparaciones ideales:
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
                    className="group flex items-center justify-between p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90 text-left transition-all cursor-pointer"
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
          <div className="rounded-lg bg-[#121215] border border-neutral-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-14 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-rose-400">
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
              className="inline-flex items-center gap-2 rounded-md bg-[#722F37] hover:bg-[#5c1d24] text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all shrink-0 shadow-sm"
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
