import { useState, useMemo } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  Star,
  Wine,
  MapPin,
  BookmarkPlus,
  Share2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Utensils,
  Sparkles,
  Soup,
  ExternalLink,
  Send,
  X,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { getEditorialWine, type WineReviewItem } from '../features/wines';
import { useAuth } from '../features/auth';
import type { AppOutletContext } from '../components/layout/AppLayout';
import type { CellarWine } from '../features/cava';
import { imageUrl } from '../lib/image';

interface ToastState {
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

interface SensoryAttribute {
  key: string;
  label: string;
  value: number; // 1.0 a 5.0
}

function calculateRating(reviews: WineReviewItem[]): string | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function getWineTypeLabel(type: string): string {
  switch (type) {
    case 'Red':
      return 'Tinto Noble';
    case 'White':
      return 'Blanco & Mineral';
    case 'Rose':
      return 'Rosado & Criolla';
    case 'Sparkling':
      return 'Espumoso Método Tradicional';
    default:
      return type.toUpperCase();
  }
}

function getPairingIcon(iconName?: string) {
  switch (iconName) {
    case 'flame':
      return <Flame className="w-4 h-4 text-[#ffb2b8]" />;
    case 'utensils':
      return <Utensils className="w-4 h-4 text-[#ffb2b8]" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-[#ffb2b8]" />;
    case 'soup':
      return <Soup className="w-4 h-4 text-[#ffb2b8]" />;
    default:
      return <Utensils className="w-4 h-4 text-[#ffb2b8]" />;
  }
}

/**
 * Renderiza una estrella con relleno fraccional continuo (0% a 100%)
 * para representar con precisión notas flotantes como 3.3, 3.4 o 4.8.
 */
function FractionalStar({ fillPercent }: { fillPercent: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(fillPercent)));
  return (
    <div className="relative inline-block w-4 h-4 text-neutral-700">
      <Star className="w-4 h-4 text-neutral-700" />
      {percent > 0 && (
        <div
          className="absolute top-0 left-0 overflow-hidden h-full text-amber-400 fill-amber-400"
          style={{ width: `${percent}%` }}
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        </div>
      )}
    </div>
  );
}

/**
 * Gráfico SVG de Telaraña / Radar Enológico del Perfil Sensorial:
 * Ejes: Cuerpo, Taninos, Acidez, Fruta, Crianza, Persistencia.
 */
function WineSensoryRadarChart({ attributes }: { attributes: SensoryAttribute[] }) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 88;
  const count = attributes.length;

  // Anillos concéntricos de referencia (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, ratio: number) => {
    const angle = index * (2 * Math.PI / count) - Math.PI / 2;
    const r = maxRadius * ratio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Coordenadas del polígono del vino
  const dataPolygonPoints = attributes
    .map((attr, i) => {
      const ratio = Math.max(0.1, Math.min(1.0, attr.value / 5.0));
      const { x, y } = getCoordinates(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[270px] h-auto drop-shadow-lg"
        aria-label="Gráfico de telaraña del perfil sensorial del vino"
      >
        {/* Anillos concéntricos */}
        {rings.map((ringRatio, rIdx) => {
          const ringPoints = attributes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, ringRatio);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={rIdx}
              points={ringPoints}
              fill="none"
              stroke="#26262b"
              strokeWidth={rIdx === rings.length - 1 ? '1.25' : '0.75'}
              strokeDasharray={rIdx === rings.length - 1 ? 'none' : '2,2'}
            />
          );
        })}

        {/* Ejes radiales */}
        {attributes.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#2c2c34"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Área del perfil sensorial relleno con halo borravino */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(114, 47, 55, 0.45)"
          stroke="#ffb2b8"
          strokeWidth="2"
          className="transition-all duration-700"
        />

        {/* Vértices con micro-puntos ámbar */}
        {attributes.map((attr, i) => {
          const ratio = Math.max(0.1, Math.min(1.0, attr.value / 5.0));
          const { x, y } = getCoordinates(i, ratio);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#fbbf24"
              stroke="#0a0a0c"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Etiquetas de los vértices */}
        {attributes.map((attr, i) => {
          const { x, y } = getCoordinates(i, 1.25);
          const isTop = y < center - 10;
          const isBottom = y > center + 10;
          const isRight = x > center + 10;
          const isLeft = x < center - 10;

          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (isRight) textAnchor = 'start';
          if (isLeft) textAnchor = 'end';

          return (
            <text
              key={i}
              x={x}
              y={y + (isTop ? -2 : isBottom ? 8 : 4)}
              textAnchor={textAnchor}
              className="fill-neutral-400 font-mono text-[9px] uppercase tracking-wider select-none font-medium"
            >
              {attr.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function getConciseAging(advice: string): string {
  const match = advice.match(/^(\d+(?:\s*(?:a|-)\s*\d+)?\+?\s*años?)/i);
  if (match) {
    return match[1];
  }
  return advice.split('.')[0]?.split(' en ')[0]?.trim() || advice;
}

/**
 * WineDetailPage Component (/vinos/:id)
 * Refactorización completa con arquitectura UI/UX moderna:
 * 1. Layout general: grid 2 columnas arriba (5 y 7), sección transversal de reseñas + gráfico (3/4 + 1/4) y maridajes al pie.
 * 2. Cero píldoras en la estética: tipografía pura en el header y grilla editorial para maridajes.
 * 3. Calificación decimal continua (1.0 a 5.0) reubicada en el flujo del formulario de reseñas con autor implícito.
 * 4. Botón de "Escribir reseña" elevado en la columna izquierda y en la cabecera comunitaria.
 * 5. Bloque de bodega espacioso, sin verde (reemplazado por ámbar/borravino) y listo para navegación futura.
 */
export default function WineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const outletCtx = useOutletContext<AppOutletContext | null>();

  // Resolución del modelo editorial
  const wine = useMemo(() => getEditorialWine(id || 'gran-enemigo-single-vineyard-gualtallary'), [id]);

  // Estados de vista
  const [selectedVintageYear, setSelectedVintageYear] = useState<number>(() => wine.vintages[0]?.year ?? 2020);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);

  // Formulario de nueva reseña (autor implícito del usuario autenticado)
  const [newReviewRating, setNewReviewRating] = useState<number>(4.5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');

  // Colección de reseñas inmutable
  const [reviews, setReviews] = useState<WineReviewItem[]>(() => wine.reviews);

  const REVIEWS_PER_PAGE = 3;

  // Cosecha activa seleccionada
  const activeVintage = useMemo(() => {
    return wine.vintages.find((v) => v.year === selectedVintageYear) || wine.vintages[0];
  }, [wine, selectedVintageYear]);

  // Calificación promedio calculada en render
  const averageRating = useMemo(() => calculateRating(reviews), [reviews]);

  // Perfil sensorial derivado de la etiqueta y varietal
  const sensoryAttributes: SensoryAttribute[] = useMemo(() => {
    const isWhite = wine.type === 'White';
    const isRose = wine.type === 'Rose';

    if (isWhite) {
      return [
        { key: 'body', label: 'Cuerpo', value: 3.2 },
        { key: 'tannins', label: 'Taninos', value: 1.2 },
        { key: 'acidity', label: 'Acidez', value: 4.8 },
        { key: 'fruit', label: 'Fruta', value: 4.6 },
        { key: 'oak', label: 'Crianza', value: 3.5 },
        { key: 'persistence', label: 'Persistencia', value: 4.4 },
      ];
    }

    if (isRose) {
      return [
        { key: 'body', label: 'Cuerpo', value: 2.8 },
        { key: 'tannins', label: 'Taninos', value: 2.0 },
        { key: 'acidity', label: 'Acidez', value: 4.6 },
        { key: 'fruit', label: 'Fruta', value: 4.7 },
        { key: 'oak', label: 'Crianza', value: 1.8 },
        { key: 'persistence', label: 'Persistencia', value: 3.9 },
      ];
    }

    // Tintos nobles (Malbec, Cabernet Franc, etc.)
    return [
      { key: 'body', label: 'Cuerpo', value: 4.7 },
      { key: 'tannins', label: 'Taninos', value: 4.8 },
      { key: 'acidity', label: 'Acidez', value: 4.3 },
      { key: 'fruit', label: 'Fruta', value: 4.4 },
      { key: 'oak', label: 'Crianza', value: 4.1 },
      { key: 'persistence', label: 'Persistencia', value: 4.9 },
    ];
  }, [wine.type]);

  // Reseñas filtradas
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
        imageUrl: (activeVintage.imageId ? imageUrl(activeVintage.imageId, 'bottle') : activeVintage.imageUrl) || undefined,
        alcoholContent: activeVintage.alcoholContent,
      };

      const updated = [newCellarWine, ...existingWines];
      localStorage.setItem('ayvino_vault_wines', JSON.stringify(updated));
    } catch {
      // Manejo silencioso de storage
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

  const handleOpenReviewForm = () => {
    setIsReviewFormOpen(true);
    const el = document.getElementById('reviews-editorial-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    // Nombre implícito del usuario autenticado
    const authorName = user?.username?.trim() || 'Sommelier Coleccionista';

    const createdReview: WineReviewItem = {
      id: `rev-${Date.now()}`,
      userName: authorName,
      vintageYear: activeVintage.year,
      rating: newReviewRating,
      createdAt: new Date().toISOString().split('T')[0],
      comment: newReviewComment.trim(),
    };

    setReviews((prev) => [createdReview, ...prev]);
    setNewReviewComment('');
    setNewReviewRating(4.5);
    setIsReviewFormOpen(false);
    showToast(`¡Tu cata (${newReviewRating.toFixed(1)} ★) fue publicada en la bitácora!`);
  };

  return (
    <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] antialiased selection:bg-[#722f37] selection:text-white pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Navegación de Retorno Minimalista */}
        <div className="mb-8">
          <Link
            to="/dashboard#catalogo"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            ← Volver a explorar
          </Link>
        </div>

        {/* 1. SECCIÓN PRINCIPAL: Grid de 2 Columnas Balanceado (5 y 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA (lg:col-span-5): Botella, Acciones & Bodega */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 flex flex-col lg:sticky lg:top-28 space-y-6">
            
            {/* Contenedor Visual de la Botella (Radio suave rounded-lg y borde sutil) */}
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-lg p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center group">
              {/* Halo orgánico con gradiente radial burdeos */}
              <div
                aria-hidden="true"
                className="absolute w-72 h-80 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-rose-950/5 to-transparent blur-2xl pointer-events-none group-hover:from-rose-900/30 transition-all duration-700"
              />

              {/* Escaparate de la botella */}
              <div className="w-full h-84 sm:h-96 flex items-center justify-center relative z-10 py-6">
                {activeVintage.imageId || activeVintage.imageUrl ? (
                  <img
                    src={activeVintage.imageId ? imageUrl(activeVintage.imageId, 'bottle')! : activeVintage.imageUrl!}
                    alt={`${wine.name} Cosecha ${activeVintage.year}`}
                    className="max-h-full object-contain filter drop-shadow-[0_28px_45px_rgba(0,0,0,0.95)] transition-transform duration-700 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs border-y border-neutral-800/80">
                    <Wine className="w-10 h-10 text-rose-300/80 stroke-[1.25] mb-3" />
                    <span className="font-serif text-base text-neutral-200">Cosecha en Cava Privada</span>
                    <span className="text-xs text-neutral-500 mt-1 font-mono">
                      Añada {activeVintage.year} certificada
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción Principales (Esquinas sobrias rounded-sm, minimalistas y sin marco envolvente) */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSaveToCellar}
                  className="h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4 text-rose-200" />
                  <span>Guardar en cava</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenReviewForm}
                  className="h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-neutral-400" />
                  <span>Escribir reseña</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Compartir ficha</span>
              </button>
            </div>

            {/* Selector de Añadas Disponibles (Limpio, horizontal y sin tarjeta contenedora) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs tracking-widest text-neutral-400 uppercase font-medium block">
                Añadas disponibles
              </span>
              <div className="flex flex-wrap gap-2">
                {wine.vintages.map((vintage) => {
                  const isSelected = vintage.year === selectedVintageYear;
                  return (
                    <button
                      key={vintage.id}
                      type="button"
                      onClick={() => setSelectedVintageYear(vintage.year)}
                      className={`rounded-sm px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800 border border-neutral-600 text-white'
                          : 'border border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span>{vintage.year}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloque Espacioso de Bodega & Terruño (Esquinas sobrias rounded-lg) */}
            <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-6 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                Bodega Elaboradora
              </span>

              {wine.winery ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-2xl text-neutral-100 font-semibold tracking-tight hover:text-amber-200 transition-colors cursor-pointer flex items-center justify-between group/winery">
                      <span>{wine.winery.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover/winery:text-amber-200 transition-transform group-hover/winery:translate-x-0.5 group-hover/winery:-translate-y-0.5" />
                    </h3>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-sans mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-300" />
                      <span>{wine.winery.region}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-xs font-mono text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Fundación histórica:</span>
                      <strong className="text-neutral-200 font-normal">{wine.winery.foundedYear}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300/90 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Trazabilidad de origen verificada</span>
                    </div>
                  </div>

                  {wine.winery.websiteUrl && (
                    <div className="pt-1">
                      <a
                        href={wine.winery.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition-colors font-mono tracking-wider"
                      >
                        <span>Sitio web oficial</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs text-neutral-400">
                  <p className="font-serif text-xl text-neutral-200">{wine.wineryNameText}</p>
                  <p className="text-neutral-500 text-[11px] font-sans">
                    Productor artesanal independiente registrado en AyVino.
                  </p>
                </div>
              )}
            </div>

            {/* Sello de trazabilidad al pie */}
            <p className="text-[11px] text-neutral-500 font-mono text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Trazabilidad y estiba enológica garantizada por AyVino</span>
            </p>
          </aside>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA (lg:col-span-7): Header, Specs & Varietal */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Header del Vino (Sin píldoras: tipografía pura y sobria) */}
            <header className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-rose-300 uppercase font-semibold">
                <span>{getWineTypeLabel(wine.type)}</span>
                <span className="text-neutral-600" aria-hidden="true">·</span>
                <span className="text-neutral-400 font-normal">Cosecha {activeVintage.year}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
                {wine.name}
              </h1>

              <p className="text-sm text-neutral-400 font-sans">
                Elaborado por <span className="text-neutral-200 font-medium">{wine.winery?.name || wine.wineryNameText}</span>
              </p>
            </header>

            {/* Tira de Especificaciones Técnicas (Estilo Ficha Técnica Editorial) */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-3 border-y border-neutral-800/80">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Calificación
                </span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {averageRating ? (
                    <>
                      <span className="text-sm font-medium text-neutral-200 font-mono">
                        {averageRating}
                      </span>
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        ({reviews.length})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-neutral-500">Sin calificar</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Graduación
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {activeVintage.alcoholContent}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Servicio
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {activeVintage.servingTemperature}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Guarda
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {getConciseAging(activeVintage.agingAdvice)}
                </span>
              </div>
            </div>

            {/* Composición Varietal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Composición Varietal
                </h2>
                <span className="text-xs font-mono text-neutral-500">Añada {activeVintage.year}</span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-900 border border-neutral-800/60">
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

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                {activeVintage.grapes.map((grape, i) => {
                  const dotColors = ['text-rose-300', 'text-amber-400', 'text-rose-200'];
                  return (
                    <div key={grape.variety} className="flex items-center gap-2">
                      <span className={dotColors[i % dotColors.length]} aria-hidden="true">●</span>
                      <span className="text-neutral-200 font-medium">{grape.variety}</span>
                      <span className="font-mono text-neutral-400">{grape.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Descripción & Terruño */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                Descripción & Terruño
              </h2>
              <p className="text-base text-neutral-300 leading-relaxed font-sans font-light">
                {wine.description}
              </p>
            </div>

            {/* Maridajes Sugeridos (Rebalance de altura con columna izquierda) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Maridajes Sugeridos
                </h2>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">Armonías recomendadas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wine.pairings.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-3.5 space-y-2 hover:border-rose-900/60 hover:bg-neutral-900/70 transition-all cursor-default"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-sm bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center group-hover:border-rose-300/40 transition-colors">
                        {getPairingIcon(p.icon)}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        Armonía 0{idx + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-base text-neutral-100 font-semibold tracking-tight group-hover:text-amber-200 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5 leading-relaxed">
                        Afinidad enológica perfecta con la acidez y estructura tánica de esta añada.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>

        {/* 2. SECCIÓN: Reseñas de la Comunidad (lg:col-span-7) + Perfil Sensorial (lg:col-span-5) */}
        <section id="reviews-editorial-section" className="border-t border-neutral-800/80 pt-12 mt-12">
          <div className="grid grid-cols-12 gap-10 items-start">
            
            {/* col-span-12 lg:col-span-7: Bitácora & Reseñas de la Comunidad */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-neutral-100 font-semibold tracking-tight">
                    Catas & Bitácora de la Comunidad
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    {reviews.length} anotaciones enológicas verificadas
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen((prev) => !prev)}
                  className="rounded-sm border border-rose-800/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40 text-xs uppercase tracking-wider px-3.5 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isReviewFormOpen ? 'Cerrar formulario' : '+ Registrar mi cata'}</span>
                </button>
              </div>

              {/* Formulario Interactivo (Sin campo de nombre: autor implícito del usuario activo) */}
              {isReviewFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-lg space-y-5 animate-in fade-in duration-300 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-rose-900/80 border border-rose-700/60 text-rose-100 flex items-center justify-center text-xs font-serif font-bold">
                        {(user?.username || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <span className="text-neutral-200 font-medium block">
                          {user?.username || 'Miembro Sommelier'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          Registrando como usuario verificado · Cosecha {activeVintage.year}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-neutral-500 hover:text-neutral-300 p-1 rounded-sm"
                      aria-label="Cerrar formulario"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Puntuación Decimal Flotante (1.0 a 5.0 con paso 0.1) */}
                  <div className="space-y-2 bg-[#0a0a0c]/60 p-4 rounded-lg border border-neutral-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-400 uppercase tracking-wider">
                        Calificación organoléptica
                      </span>
                      <span className="font-mono text-sm text-amber-300 font-bold">
                        {newReviewRating.toFixed(1)} / 5.0 ★
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starIndex) => {
                          const fillPercent = Math.max(0, Math.min(1, newReviewRating - (starIndex - 1))) * 100;
                          return <FractionalStar key={starIndex} fillPercent={fillPercent} />;
                        })}
                      </div>

                      <span className="text-[11px] font-mono text-neutral-500">
                        Deslizá con precisión de décimas
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(parseFloat(e.target.value))}
                      className="w-full accent-rose-700 h-1.5 bg-neutral-800 rounded-lg cursor-pointer mt-1"
                      aria-label="Seleccionar puntuación decimal"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-xs font-mono text-neutral-400 mb-1.5">
                      Nota de Cata & Sensaciones en boca
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Describí aromas primarios, textura en el paladar, estructura de taninos y guarda..."
                      className="w-full bg-[#0a0a0c] border border-neutral-800 text-neutral-200 text-xs p-3.5 rounded-sm focus:border-rose-700 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 transition-colors rounded-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 flex items-center gap-2 cursor-pointer"
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
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500">Filtrar:</span>
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
                          ? 'border-b-2 border-rose-400 text-white font-medium'
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

              {/* Feed de reseñas en tarjetas individuales limpias */}
              <div className="space-y-3">
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-serif text-neutral-300 flex items-center justify-center font-semibold shrink-0">
                            {rev.userName.charAt(0)}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-neutral-200 block">
                              {rev.userName}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                              {rev.createdAt} · Cosecha {rev.vintageYear}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs whitespace-nowrap">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={i < Math.floor(rev.rating) ? 'text-amber-400' : 'text-neutral-700'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="font-mono text-neutral-200 text-xs font-semibold">
                            {rev.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                        {rev.comment}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs font-mono text-neutral-500 bg-neutral-900/20 border border-neutral-800/40 rounded-lg">
                    No hay reseñas registradas para el filtro seleccionado.
                  </div>
                )}
              </div>

              {/* Paginación */}
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
                        className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer rounded-sm ${
                          currentPage === idx + 1
                            ? 'bg-rose-900/60 border border-rose-700/60 text-white font-bold'
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
                    className={`transition-colors cursor-pointer rounded-sm px-2 py-1 ${
                      currentPage === totalPages
                        ? 'text-neutral-700 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>

            {/* col-span-12 lg:col-span-5: Perfil Sensorial Enológico (Radar Chart) */}
            <aside className="col-span-12 lg:col-span-5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-300" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-semibold">
                    Perfil Sensorial
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  Escala 1 a 5
                </span>
              </div>

              {/* Gráfico Radar SVG */}
              <WineSensoryRadarChart attributes={sensoryAttributes} />

              {/* Desglose de Atributos (Tipografía homogénea text-xs font-mono text-neutral-300 y barras 4px) */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
                {sensoryAttributes.map((attr) => (
                  <div key={attr.key} className="flex items-center justify-between text-xs font-mono text-neutral-300">
                    <span>{attr.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-900 to-rose-400 rounded-full"
                          style={{ width: `${(attr.value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-neutral-200 font-semibold w-7 text-right">
                        {attr.value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dictamen Enológico al pie del gráfico */}
              <div className="bg-[#0a0a0c]/80 border border-neutral-800/60 p-3 rounded-lg text-center">
                <span className="text-[11px] font-serif italic text-neutral-300 block">
                  "Expresión de gran tensión y concentración con nervio mineral característico."
                </span>
              </div>
            </aside>
          </div>
        </section>

        {/* Notificación Toast Flotante */}
        {toast && (
          <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 text-white text-xs px-5 py-3.5 shadow-2xl flex items-center gap-3 font-mono rounded-sm animate-in slide-in-from-bottom-5 duration-200"
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
