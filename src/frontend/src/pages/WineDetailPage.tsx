import { useState, useMemo } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  Award,
  Star,
  Wine,
  MapPin,
  BookmarkPlus,
  Share2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Utensils,
  Sparkles,
  Soup,
  ExternalLink,
  Send,
  X,
} from 'lucide-react';
import { getEditorialWine, type WineReviewItem } from '../features/wines';
import type { AppOutletContext } from '../components/layout/AppLayout';
import type { CellarWine } from '../features/cava';

interface ToastState {
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

function calculateRating(reviews: WineReviewItem[]): string | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function getWineTypeBadgeStyle(type: string) {
  switch (type) {
    case 'Red':
      return {
        label: 'TINTO NOBLE',
        dot: 'bg-[#ffb2b8]',
        border: 'border-[#ffb2b8]/40',
        text: 'text-[#ffdadb]',
      };
    case 'White':
      return {
        label: 'BLANCO & MINERAL',
        dot: 'bg-[#ffc640]',
        border: 'border-[#ffc640]/40',
        text: 'text-[#ffdf9f]',
      };
    case 'Rose':
      return {
        label: 'ROSADO & CRIOLLA',
        dot: 'bg-[#ffb2b7]',
        border: 'border-[#ffb2b7]/40',
        text: 'text-[#ffdadb]',
      };
    case 'Sparkling':
      return {
        label: 'ESPUMOSO & MÉTODO TRADICIONAL',
        dot: 'bg-[#ffc640]',
        border: 'border-[#ffc640]/40',
        text: 'text-[#ffdf9f]',
      };
    default:
      return {
        label: type.toUpperCase(),
        dot: 'bg-neutral-400',
        border: 'border-neutral-700',
        text: 'text-neutral-300',
      };
  }
}

function getPairingIcon(iconName?: string) {
  switch (iconName) {
    case 'flame':
      return <Flame className="w-3.5 h-3.5 text-[#ffb2b8]" />;
    case 'utensils':
      return <Utensils className="w-3.5 h-3.5 text-[#ffb2b8]" />;
    case 'sparkles':
      return <Sparkles className="w-3.5 h-3.5 text-[#ffb2b8]" />;
    case 'soup':
      return <Soup className="w-3.5 h-3.5 text-[#ffb2b8]" />;
    default:
      return <Utensils className="w-3.5 h-3.5 text-[#ffb2b8]" />;
  }
}

/**
 * WineDetailPage Component (/vinos/:id)
 * Vista "AyVino — Ficha Editorial de Vino (Diseño Despojado & Fluido)" de Stitch.
 *
 * Características de diseño:
 * - Estética nocturna profunda (#0a0a0c) con cero cards contenedoras cuadradas.
 * - Columna izquierda: Botella flotante con halo degradado radial orgánico, selector plano
 *   de cosechas, calificación rápida 1-5 estrellas, bloque de bodega con trazabilidad y acciones.
 * - Columna derecha: Franja continua de datos con divisores verticales suaves, composición varietal
 *   con barra tricolor, notas de terruño, maridajes recomendados y bitácora comunitaria con filtros.
 * - Módulo de registro de cata interactivo para sumar notas a la comunidad.
 * - Guardado directo en la Cava privada con actualización reactiva del stock global.
 */
export default function WineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const outletCtx = useOutletContext<AppOutletContext | null>();

  // Resolución inicial del modelo editorial (en memoria o generador enológico)
  const wine = useMemo(() => getEditorialWine(id || 'gran-enemigo-single-vineyard-gualtallary'), [id]);

  // Estados propios e independientes
  const [selectedVintageYear, setSelectedVintageYear] = useState<number>(() => wine.vintages[0]?.year ?? 2020);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);

  // Formulario controlado de nueva reseña
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Colección de reseñas (inmutable, ampliable localmente por el usuario)
  const [reviews, setReviews] = useState<WineReviewItem[]>(() => wine.reviews);

  const REVIEWS_PER_PAGE = 3;

  // Cosecha activa seleccionada
  const activeVintage = useMemo(() => {
    return wine.vintages.find((v) => v.year === selectedVintageYear) || wine.vintages[0];
  }, [wine, selectedVintageYear]);

  // Calificación promedio calculada en tiempo de render
  const averageRating = useMemo(() => calculateRating(reviews), [reviews]);

  const typeBadge = useMemo(() => getWineTypeBadgeStyle(wine.type), [wine.type]);

  // Reseñas filtradas por estrellas
  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    const targetStar = parseInt(starFilter, 10);
    return reviews.filter((rev) => Math.floor(rev.rating) === targetStar);
  }, [reviews, starFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));

  const displayedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const showToast = (message: string, actionLabel?: string, actionTo?: string) => {
    setToast({ message, actionLabel, actionTo });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  /**
   * Guarda la botella en la Cava del usuario:
   * 1. Actualiza el contador global de stock en AppOutletContext.
   * 2. Inserta el registro en localStorage ('ayvino_vault_wines').
   * 3. Despliega toast con acción directa para ir a /cava.
   */
  const handleSaveToCellar = () => {
    if (outletCtx?.setStockCount) {
      outletCtx.setStockCount((prev) => prev + 1);
    }

    try {
      const storedWinesRaw = localStorage.getItem('ayvino_vault_wines');
      const existingWines: CellarWine[] = storedWinesRaw ? JSON.parse(storedWinesRaw) : [];

      const newCellarWine: CellarWine = {
        id: `vault-added-${Date.now()}`,
        name: `${wine.name} ${activeVintage.year}`,
        winery: wine.winery?.name || wine.wineryNameText,
        region: wine.winery?.region || 'Valle de Uco, Mendoza',
        varietal: activeVintage.grapes[0]?.variety || 'Malbec',
        vintage: activeVintage.year,
        rating: Math.round((parseFloat(averageRating || '4.8') / 5) * 100),
        units: 1,
        location: 'Cava Principal · Estante de Selección',
        temperatureConst: '15°C CONSTANTE',
        terroirNote: wine.description.slice(0, 80) + '...',
        agingStatus: 'aging',
        agingStatusLabel: `Guarda recomendada: ${activeVintage.agingAdvice.split('.')[0]}`,
        isJewel: false,
        bottle: 'red-black',
        imageUrl: activeVintage.imageUrl || undefined,
        alcoholContent: activeVintage.alcoholContent,
      };

      const updated = [newCellarWine, ...existingWines];
      localStorage.setItem('ayvino_vault_wines', JSON.stringify(updated));
    } catch {
      // Manejo silencioso de cuota o restricción de storage
    }

    showToast(
      `¡"${wine.name} (${activeVintage.year})" guardado en tu Cava!`,
      'Ver en mi Cava',
      '/cava'
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Enlace de ficha enológica copiado al portapapeles.');
    } else {
      showToast('Enlace listo para compartir.');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const createdReview: WineReviewItem = {
      id: `rev-${Date.now()}`,
      userName: newReviewAuthor.trim() || 'Catador Sommelier',
      vintageYear: activeVintage.year,
      rating: newReviewRating,
      createdAt: new Date().toISOString().split('T')[0],
      comment: newReviewComment.trim(),
    };

    setReviews((prev) => [createdReview, ...prev]);
    setNewReviewComment('');
    setNewReviewAuthor('');
    setIsReviewFormOpen(false);
    showToast('¡Tu cata fue registrada exitosamente en la bitácora!');
  };

  return (
    <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] antialiased selection:bg-[#722f37] selection:text-white pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera Editorial Superior: Breadcrumb semántico y botón de regreso */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-900 mb-10">
          <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Link to="/dashboard#catalogo" className="hover:text-white transition-colors">
              Explorador
            </Link>
            <span className="text-neutral-700" aria-hidden="true">/</span>
            <span className="text-neutral-400 truncate max-w-[200px]">
              {wine.winery?.name || wine.wineryNameText}
            </span>
            <span className="text-neutral-700" aria-hidden="true">/</span>
            <span className="text-white font-sans truncate max-w-xs font-medium">
              {wine.name}
            </span>
          </nav>

          <Link
            to="/dashboard#catalogo"
            className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 border-b border-neutral-800 hover:border-[#ffb2b8] flex items-center gap-1.5 transition-colors font-mono tracking-wider"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Volver al Explorador</span>
          </Link>
        </div>

        {/* Grilla Editorial Fluida de 2 Columnas (Cero cards cuadradas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA: Botella Flotante & Tipografía Despojada */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 flex flex-col lg:sticky lg:top-28">
            
            {/* 1. Calificación de usuario (1 a 5 estrellas) */}
            <div className="flex items-center justify-between py-2 border-b border-neutral-900 text-xs">
              <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] uppercase tracking-widest">
                <Award className="w-3.5 h-3.5 text-[#ffb2b8]" />
                <span>Calificar este vino:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5" role="group" aria-label="Puntuar vino de 1 a 5 estrellas">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || userRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                        onClick={() => {
                          setUserRating(star);
                          showToast(`¡Puntuaste este vino con ${star} de 5 estrellas!`);
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-neutral-600 hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFilled ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="font-mono text-[11px] text-neutral-400 min-w-[70px] text-right">
                  {userRating > 0 ? (
                    <strong className="text-amber-300 font-semibold">{userRating}/5 ★</strong>
                  ) : (
                    'Sin puntuar'
                  )}
                </span>
              </div>
            </div>

            {/* 2. Escaparate de la botella: Flotando libremente con halo degradado radial orgánico */}
            <div className="relative w-full flex flex-col items-center justify-center py-10 group">
              <div
                aria-hidden="true"
                className="absolute w-72 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#722f37]/25 via-[#722f37]/5 to-transparent blur-2xl pointer-events-none group-hover:from-[#722f37]/35 transition-all duration-700"
              />

              <div className="w-full h-84 sm:h-96 flex items-center justify-center relative z-10">
                {activeVintage.imageUrl ? (
                  <img
                    src={activeVintage.imageUrl}
                    alt={`${wine.name} Cosecha ${activeVintage.year}`}
                    className="max-h-full object-contain filter drop-shadow-[0_28px_45px_rgba(0,0,0,0.95)] transition-transform duration-700 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs border-y border-neutral-900">
                    <Wine className="w-10 h-10 text-[#ffb2b8] stroke-[1.25] mb-3" />
                    <span className="font-serif text-base text-neutral-200">Cosecha en Cava Privada</span>
                    <span className="text-xs text-neutral-500 mt-1 font-mono">
                      Añada {activeVintage.year} certificada
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Selector de Cosecha: Segmented pills planas */}
            <div className="py-4 border-t border-neutral-900">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-3">
                <span>Añadas disponibles:</span>
                <span className="text-neutral-400 font-normal">{activeVintage.alcoholContent}</span>
              </div>
              <div className="flex items-center gap-2">
                {wine.vintages.map((vintage) => {
                  const isSelected = vintage.year === selectedVintageYear;
                  return (
                    <button
                      key={vintage.id}
                      type="button"
                      onClick={() => setSelectedVintageYear(vintage.year)}
                      className={`flex-1 py-2 px-3 text-xs font-mono transition-all text-center rounded-sm cursor-pointer ${
                        isSelected
                          ? 'bg-[#722f37] text-white font-medium shadow-sm'
                          : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                      }`}
                    >
                      <span className="block font-semibold">{vintage.year}</span>
                      <span className={`block text-[10px] ${isSelected ? 'text-[#ffdadb]' : 'text-neutral-500'}`}>
                        {vintage.alcoholContent}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Bodega & Terruño: Texto editorial fluido */}
            <div className="pt-6 mt-2 border-t border-neutral-800/80 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">
                Bodega & Terruño
              </span>
              {wine.winery ? (
                <div className="space-y-2">
                  <h2 className="font-serif text-xl text-white font-normal">
                    {wine.winery.name}
                  </h2>
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#ffb2b8]" />
                    <span>{wine.winery.region}</span>
                  </p>
                  <div className="flex items-center gap-6 pt-1 text-xs font-mono text-neutral-400">
                    <span>
                      Fundación: <strong className="text-neutral-200 font-normal">{wine.winery.foundedYear}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Trazabilidad verificada
                    </span>
                  </div>
                  {wine.winery.websiteUrl && (
                    <div className="pt-1">
                      <a
                        href={wine.winery.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#ffb2b8] hover:text-white transition-colors font-mono tracking-wider"
                      >
                        <span>Visitar sitio web oficial</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-xs text-neutral-400">
                  <p className="font-serif text-lg text-neutral-200">{wine.wineryNameText}</p>
                  <p className="text-neutral-500 text-[11px] font-sans">
                    Productor artesanal independiente registrado en AyVino.
                  </p>
                </div>
              )}
            </div>

            {/* 5. Botones de acción principales */}
            <div className="pt-8 space-y-3">
              <button
                type="button"
                onClick={handleSaveToCellar}
                className="w-full bg-[#722f37] hover:bg-[#853741] active:bg-[#60252c] text-white text-xs font-medium py-3 px-4 tracking-widest uppercase font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Guardar en mi cava</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full bg-transparent hover:bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#ffb2b8]" />
                  <span>Compartir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('reviews-editorial-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setIsReviewFormOpen(true);
                  }}
                  className="w-full bg-transparent hover:bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#ffb2b8]" />
                  <span>Escribir reseña</span>
                </button>
              </div>

              {/* Sello de trazabilidad al pie */}
              <p className="pt-2 text-[11px] text-neutral-500 font-mono text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Trazabilidad y estiba enológica garantizada por AyVino</span>
              </p>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA: Tipografía Pura & Datos Enológicos Fluidos */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 flex flex-col space-y-12">
            
            {/* 1. Encabezado */}
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${typeBadge.border} ${typeBadge.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${typeBadge.dot}`} />
                  {typeBadge.label}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Añada Seleccionada: <strong className="text-white font-medium">{activeVintage.year}</strong>
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.08]">
                {wine.name}
              </h1>

              <p className="text-sm text-neutral-400 font-sans">
                Elaborado por <span className="text-neutral-200 font-medium">{wine.winery?.name || wine.wineryNameText}</span>
              </p>
            </header>

            {/* 2. Franja Continua de Datos (Data Strip) */}
            <div className="py-6 border-y border-neutral-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-800/70">
              {/* Dato 1: Calificación */}
              <div className="flex flex-col space-y-1 md:pr-4">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Calificación</span>
                {averageRating ? (
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-light text-white font-mono">{averageRating}</span>
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="text-xs font-mono text-neutral-500 ml-0.5">({reviews.length})</span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-[#ffb2b8] pt-2">Sin calificaciones</span>
                )}
              </div>

              {/* Dato 2: Graduación */}
              <div className="flex flex-col space-y-1 pt-4 md:pt-0 md:px-5">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Graduación</span>
                <span className="text-2xl font-light text-white font-mono pt-1">
                  {activeVintage.alcoholContent}
                </span>
              </div>

              {/* Dato 3: Temperatura */}
              <div className="flex flex-col space-y-1 pt-4 md:pt-0 md:px-5">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Servicio</span>
                <span className="text-2xl font-light text-white font-mono pt-1">
                  {activeVintage.servingTemperature}
                </span>
              </div>

              {/* Dato 4: Guarda Cava */}
              <div className="flex flex-col space-y-1 pt-4 md:pt-0 md:pl-5">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Guarda Cava</span>
                <span className="text-sm font-sans text-neutral-200 font-light leading-snug pt-1">
                  {activeVintage.agingAdvice.split('.')[0]}
                </span>
              </div>
            </div>

            {/* 3. Composición Varietal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
                  Composición Varietal
                </span>
                <span className="text-neutral-500">Añada {activeVintage.year}</span>
              </div>

              {/* Fina barra tricolor de progreso */}
              <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-neutral-900">
                {activeVintage.grapes.map((grape, i) => {
                  const colors = ['bg-[#722f37]', 'bg-[#b43747]', 'bg-[#e3aa00]', 'bg-[#d8c1c2]'];
                  return (
                    <div
                      key={grape.variety}
                      style={{ width: `${grape.percentage}%` }}
                      className={`${colors[i % colors.length]} h-full transition-all duration-500`}
                      title={`${grape.variety}: ${grape.percentage}%`}
                    />
                  );
                })}
              </div>

              {/* Desglose en línea */}
              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                {activeVintage.grapes.map((grape, i) => {
                  const dotColors = ['text-[#ffb2b8]', 'text-[#ffc640]', 'text-[#ffdadb]'];
                  return (
                    <div key={grape.variety} className="flex items-center gap-2">
                      <span className={dotColors[i % dotColors.length]} aria-hidden="true">●</span>
                      <span className="text-neutral-200 font-medium">{grape.variety}</span>
                      <span className="font-mono text-neutral-400">{grape.percentage}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Cita enológica */}
              <p className="text-xs text-neutral-400 leading-relaxed pt-2 font-serif italic text-sm text-neutral-300/90">
                "{activeVintage.agingAdvice}"
              </p>
            </div>

            {/* 4. Descripción & Terruño */}
            <div className="space-y-3 pt-4 border-t border-neutral-800/60">
              <h2 className="font-serif text-2xl text-white font-normal">Descripción & Terruño</h2>
              <p className="text-base text-neutral-300 leading-relaxed font-sans font-light">
                {wine.description}
              </p>
            </div>

            {/* 5. Maridajes Sugeridos */}
            <div className="space-y-4 pt-4 border-t border-neutral-800/60">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-white font-normal">Maridajes Sugeridos</h2>
                <span className="text-xs font-mono text-neutral-500">Armonías recomendadas</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {wine.pairings.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-neutral-900/60 border border-neutral-800 text-neutral-300 hover:border-[#722f37]/70 transition-colors"
                  >
                    {getPairingIcon(p.icon)}
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 6. Catas & Bitácora de la Comunidad */}
            <section id="reviews-editorial-section" className="space-y-6 pt-6 border-t border-neutral-800/80">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-white font-normal">
                    Catas & Bitácora de la Comunidad
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    {reviews.length} anotaciones enológicas verificadas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen((prev) => !prev)}
                  className="text-xs text-neutral-200 hover:text-white px-4 py-2 border-b border-neutral-700 hover:border-[#ffb2b8] transition-colors font-mono tracking-wider uppercase cursor-pointer"
                >
                  {isReviewFormOpen ? 'Cerrar formulario' : '+ Registrar cata'}
                </button>
              </div>

              {/* Formulario Interactivo de Nueva Reseña */}
              {isReviewFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-[#121215] border border-neutral-800/90 p-5 rounded-sm space-y-4 animate-in fade-in duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                      Nueva Anotación Enológica (Añada {activeVintage.year})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="review-author" className="block text-xs font-mono text-neutral-400 mb-1">
                        Tu nombre / Firma sommelier
                      </label>
                      <input
                        id="review-author"
                        type="text"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        placeholder="Ej. Lucas Sommelier"
                        className="w-full bg-[#0a0a0c] border border-neutral-800 text-neutral-200 text-xs px-3 py-2 rounded-sm focus:border-[#722f37] focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-mono text-neutral-400 mb-1">Puntuación</span>
                      <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star
                              className={`w-4 h-4 cursor-pointer ${
                                newReviewRating >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="font-mono text-xs text-neutral-300 ml-2 font-semibold">
                          {newReviewRating}/5 ★
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-xs font-mono text-neutral-400 mb-1">
                      Nota de Cata & Sensaciones en copa
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Describe color, nariz, textura en boca, taninos y potencial de evolución..."
                      className="w-full bg-[#0a0a0c] border border-neutral-800 text-neutral-200 text-xs p-3 rounded-sm focus:border-[#722f37] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#722f37] hover:bg-[#853741] text-white text-xs font-mono tracking-wider uppercase px-4 py-2 flex items-center gap-2 rounded-sm transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Anotación</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Filtro minimalista por estrellas */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-900 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] uppercase tracking-widest text-neutral-500">Filtrar:</span>
                  {(
                    [
                      { id: 'all', label: 'Todas' },
                      { id: '5', label: '5 ★' },
                      { id: '4', label: '4 ★' },
                      { id: '3', label: '3 ★' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStarFilter(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`py-1 px-2.5 transition-colors cursor-pointer ${
                        starFilter === tab.id
                          ? 'border-b-2 border-[#ffb2b8] text-white font-medium'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px]">
                  Mostrando {displayedReviews.length} de {filteredReviews.length}
                </span>
              </div>

              {/* Feed de reseñas: Entradas de lista con un separador horizontal simple */}
              <div className="divide-y divide-neutral-900">
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((rev) => (
                    <article key={rev.id} className="py-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-serif text-neutral-300 flex items-center justify-center font-semibold">
                            {rev.userName.charAt(0)}
                          </span>
                          <div>
                            <span className="text-sm font-serif text-white block">{rev.userName}</span>
                            <span className="text-[11px] font-mono text-neutral-500">
                              {rev.createdAt} · Cosecha {rev.vintageYear}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400/90 text-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(rev.rating) ? 'text-amber-400' : 'text-neutral-800'}
                            >
                              ★
                            </span>
                          ))}
                          <span className="font-mono text-neutral-300 ml-1.5 text-xs font-semibold">
                            {rev.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed font-sans pl-11 font-light italic">
                        "{rev.comment}"
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs font-mono text-neutral-500">
                    No hay reseñas registradas para el filtro seleccionado.
                  </div>
                )}
              </div>

              {/* Paginación minimalista */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-900 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`transition-colors cursor-pointer ${
                      currentPage === 1
                        ? 'text-neutral-700 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ← Anterior
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                          currentPage === idx + 1
                            ? 'border-b-2 border-[#ffb2b8] text-white font-bold'
                            : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`transition-colors cursor-pointer ${
                      currentPage === totalPages
                        ? 'text-neutral-700 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </section>
          </section>
        </div>

        {/* Notificación Toast Flotante */}
        {toast && (
          <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-[#141418] border border-neutral-800 text-white text-xs px-5 py-3.5 shadow-2xl flex items-center gap-3 font-mono animate-in slide-in-from-bottom-5 duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            {toast.actionLabel && toast.actionTo && (
              <Link
                to={toast.actionTo}
                className="ml-2 text-[#ffb2b8] hover:text-white underline font-semibold transition-colors"
              >
                {toast.actionLabel} &rarr;
              </Link>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
