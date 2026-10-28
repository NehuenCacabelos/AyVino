import { Link } from 'react-router-dom';
import {
  Thermometer,
  Wine,
  ArrowRight,
  ChefHat,
  Bookmark,
  Layers,
  UtensilsCrossed,
  Sparkles,
  Droplet,
  Compass,
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
        {/* Cabecera Editorial de la Comida - Fondo Grafito con Contraste Elevado */}
        <div className="bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-black/50">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-amber-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {food.badge}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                Principio: {food.principle}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-100">
              {food.title}
            </h3>

            {/* Platos Criollos Sugeridos */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Platos de referencia:
              </span>
              {food.dishes.map((dish) => (
                <span
                  key={dish}
                  className="px-3 py-1 rounded-lg bg-[#111115] border border-neutral-700/50 text-neutral-200 text-xs font-sans shadow-sm"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ficha Sommelier: Por qué funciona & Cepas Sugeridas (Zona de Lectura Grafito) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Por qué funciona (7 cols) */}
          <div className="lg:col-span-7 bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300">
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
            <div className="mt-6 pt-5 border-t border-neutral-700/60 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-neutral-400 font-mono">Temp:</span>
                <span className="font-mono font-medium text-neutral-100">{food.servingTemperature}</span>
              </div>

              <span className="hidden sm:inline text-neutral-700">|</span>

              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-amber-300 shrink-0" />
                <span className="text-neutral-400 font-mono">Copa:</span>
                <span className="font-sans text-neutral-100">{food.glassware}</span>
              </div>

              <span className="hidden sm:inline text-neutral-700">|</span>

              <div className="flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-rose-400/80 shrink-0" />
                <span className="text-neutral-300 font-sans">{food.serviceTip}</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Cepas Sugeridas (5 cols) */}
          <div className="lg:col-span-5 bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300">
                  <Layers className="h-4 w-4" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  Cepas recomendadas
                </h4>
              </div>

              <p className="text-xs text-neutral-400">
                Hacé clic en cualquier cepa para ver su perfil sensorial y notas de sommelier:
              </p>

              {/* Botones de Cepas con Microinteracciones */}
              <div className="flex flex-col gap-2.5 mt-1">
                {food.recommendedVarieties.map((varId) => {
                  const variety = getWineVariety(varId);
                  if (!variety) return null;

                  return (
                    <button
                      key={varId}
                      type="button"
                      onClick={() => onSelectWine(varId)}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-[#111115]/80 border border-neutral-700/50 hover:border-neutral-500 hover:bg-[#181820] text-left transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                            {variety.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                            {variety.wineType}
                          </span>
                        </div>

                        {/* Indicador textual minimalista que se ilumina al hover */}
                        <span className="text-[11px] font-mono text-neutral-400 group-hover:text-amber-200/90 transition-colors">
                          {variety.body} · Acidez {variety.acidity}
                          {variety.tannins ? ` · Taninos ${variety.tannins.split(' ')[0].toLowerCase()}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-neutral-500 group-hover:text-rose-400 transition-colors shrink-0">
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

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Cabecera Editorial del Vino - Tratamiento Grafito Elevado con Contraste */}
      <div className="bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-black/50">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-rose-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5" />
              {wine.wineType} · {wine.categoryGroup}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cuerpo: {wine.body}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-400" />
              Acidez: {wine.acidity}
            </span>
            {wine.tannins && (
              <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 font-mono text-xs uppercase tracking-wider">
                Taninos: {wine.tannins}
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-100">
            {wine.title}
          </h3>

          {/* Descriptores Aromáticos */}
          <div className="rounded-xl bg-[#111115]/90 border border-neutral-700/50 p-4 mt-1">
            <span className="text-[10px] font-mono uppercase text-amber-300/80 tracking-wider block mb-1">
              Perfil Aromático & Notas de Cata:
            </span>
            <p className="text-sm font-sans text-neutral-200 leading-relaxed">
              {wine.flavorProfile}
            </p>
          </div>
        </div>
      </div>

      {/* Ficha Sommelier: Por qué funciona & Platos Sugeridos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Por qué funciona (7 cols) */}
        <div className="lg:col-span-7 bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300">
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
              <div className="flex items-center gap-2 pt-2 text-xs font-mono text-neutral-400">
                <span className="text-neutral-500 uppercase">Sensación en boca:</span>
                <span className="text-amber-200/90">{wine.tannins}</span>
              </div>
            )}
          </div>

          {/* Barra Compacta de Servicio: Temperatura, Cristalería y Tip */}
          <div className="mt-6 pt-5 border-t border-neutral-700/60 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-neutral-400 font-mono">Temp:</span>
              <span className="font-mono font-medium text-neutral-100">{wine.servingTemperature}</span>
            </div>

            <span className="hidden sm:inline text-neutral-700">|</span>

            <div className="flex items-center gap-2">
              <Wine className="h-4 w-4 text-amber-300 shrink-0" />
              <span className="text-neutral-400 font-mono">Copa:</span>
              <span className="font-sans text-neutral-100">{wine.glassware}</span>
            </div>

            <span className="hidden sm:inline text-neutral-700">|</span>

            <div className="flex items-center gap-2">
              <Bookmark className="h-3.5 w-3.5 text-rose-400/80 shrink-0" />
              <span className="text-neutral-300 font-sans">{wine.serviceTip}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Platos Sugeridos (5 cols) */}
        <div className="lg:col-span-5 bg-[#16161c]/95 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300">
                <UtensilsCrossed className="h-4 w-4 text-neutral-300" />
              </div>
              <h4 className="font-serif text-xl font-semibold text-neutral-100">
                Maridajes recomendados
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
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-[#111115]/80 border border-neutral-700/50 hover:border-neutral-500 hover:bg-[#181820] text-left transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-serif text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                        {foodCat.title}
                      </span>
                      <span className="text-xs text-neutral-400 line-clamp-1">
                        {foodCat.dishes.slice(0, 3).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-neutral-500 group-hover:text-rose-400 transition-colors shrink-0">
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
