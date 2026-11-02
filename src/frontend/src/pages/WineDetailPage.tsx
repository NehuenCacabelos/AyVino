import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Loader2,
  AlertCircle,
  Bookmark,
  Heart,
  Camera,
  Trash2,
} from 'lucide-react';
import { imageUrl } from '../lib/image';
import { useAuth } from '../features/auth';
import {
  getWineById,
  getWineVintages,
  getWineVintageById,
} from '../features/winery/api/wineApi';
import { getWineryPublicProfile } from '../features/winery/api/wineryPublicApi';
import { getWinePairings } from '../features/winery/api/wineryWinePairingsApi';
import { getGrapes } from '../features/winery/api/grapeApi';
import {
  getVintageReviews,
  createReview,
  updateReview,
  deleteReview,
  type ReviewResponseDto,
} from '../features/reviews';
import AddToCellarForm from '../features/cava/components/AddToCellarForm';
import {
  getMyWineMarks,
  markWineAsWanted,
  unmarkWineAsWanted,
  markWineAsFavorite,
  unmarkWineAsFavorite,
  type UserWineMarksResponseDto,
} from '../features/userWines';
import {
  getMyVintageImage,
  uploadMyVintageImage,
  deleteMyVintageImage,
} from '../features/wines';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  WineryPublicProfileResponseDto,
  WineryWinePairingDto,
  GrapeResponseDto,
} from '../features/winery/types';

interface ToastState {
  message: string;
  actionLabel?: string;
  actionTo?: string;
  isError?: boolean;
}

function getWineTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'red':
      return 'Tinto Noble';
    case 'white':
      return 'Blanco & Mineral';
    case 'rose':
      return 'Rosado & Criolla';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type;
  }
}

function getPairingIcon(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('carne') || cat.includes('asado') || cat.includes('fuego')) {
    return <Flame className="w-4 h-4 text-[#ffb2b8]" />;
  }
  if (cat.includes('pasta') || cat.includes('guiso') || cat.includes('sopa')) {
    return <Soup className="w-4 h-4 text-[#ffb2b8]" />;
  }
  if (cat.includes('postre') || cat.includes('queso') || cat.includes('especial')) {
    return <Sparkles className="w-4 h-4 text-[#ffb2b8]" />;
  }
  return <Utensils className="w-4 h-4 text-[#ffb2b8]" />;
}

function getConciseAging(advice: string | null | undefined): string {
  if (!advice) return 'Apta para consumo o guarda';
  const match = advice.match(/^(\d+(?:\s*(?:a|-)\s*\d+)?\+?\s*años?)/i);
  if (match) {
    return match[1];
  }
  return advice.split('.')[0]?.split(' en ')[0]?.trim() || advice;
}

/**
 * Vista 1: Ficha de Vino (/vinos/:id)
 * Conectada a la API real de AyVino para metadatos, cosechas, marcas, reseñas y fotos personales.
 */
interface ReviewFormProps {
  myReview: ReviewResponseDto | null;
  vintageYear: number | null;
  username?: string;
  isSubmitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

function ReviewForm({
  myReview,
  vintageYear,
  username,
  isSubmitting,
  formError,
  onClose,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(() => myReview?.rating ?? 5);
  const [comment, setComment] = useState<string>(() => myReview?.comment ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, comment);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-lg space-y-5 animate-in fade-in duration-300 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-900/80 border border-rose-700/60 text-rose-100 flex items-center justify-center text-xs font-serif font-bold">
            {(username || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="text-xs">
            <span className="text-neutral-200 font-medium block">
              {username || 'Miembro Sommelier'}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              {myReview ? 'Editando tu reseña' : 'Nueva cata registrada'} · Cosecha{' '}
              {vintageYear ?? 'Sin añada'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 p-1 rounded-sm"
          aria-label="Cerrar formulario"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {formError && (
        <div className="p-3 text-xs font-mono bg-red-950/40 border border-red-800/60 text-red-200 rounded-sm">
          {formError}
        </div>
      )}

      {/* Calificación con estrellas enteras (1 a 5) */}
      <div className="space-y-2 bg-[#0a0a0c]/60 p-4 rounded-lg border border-neutral-800/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-neutral-400 uppercase tracking-wider">
            Puntaje organoléptico
          </span>
          <span className="font-mono text-sm text-amber-300 font-bold">
            {rating} de 5 ★
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
              className="p-1 text-neutral-700 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-neutral-700'
                }`}
              />
            </button>
          ))}
          <span className="text-[11px] font-mono text-neutral-500 ml-2">
            (Calificación entera de 1 a 5)
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="review-comment" className="block text-xs font-mono text-neutral-400">
            Nota de Cata & Sensaciones en boca (opcional)
          </label>
          <span className="text-[11px] font-mono text-neutral-500">
            {comment.length} / 1000
          </span>
        </div>
        <textarea
          id="review-comment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describí aromas primarios, textura en el paladar, estructura de taninos y guarda..."
          className="w-full bg-[#0a0a0c] border border-neutral-800 text-neutral-200 text-xs p-3.5 rounded-sm focus:border-rose-700 focus:outline-none font-sans leading-relaxed"
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 transition-colors rounded-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{myReview ? 'Actualizar Anotación' : 'Publicar Anotación'}</span>
        </button>
      </div>
    </form>
  );
}

export default function WineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Parsing y validación del ID numérico
  const wineId = useMemo(() => {
    const n = parseInt(id || '', 10);
    return Number.isNaN(n) || n <= 0 ? null : n;
  }, [id]);

  const isInvalidId = wineId === null;
  const [isNotFoundResponse, setIsNotFoundResponse] = useState<boolean>(false);
  const isNotFound = isInvalidId || isNotFoundResponse;
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Estados de carga y error a nivel página
  const [isLoading, setIsLoading] = useState<boolean>(!isInvalidId);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Datos principales del vino
  const [wine, setWine] = useState<WineResponseDto | null>(null);
  const [vintages, setVintages] = useState<WineVintageResponseDto[]>([]);
  const [selectedVintageId, setSelectedVintageId] = useState<number | null>(null);
  const [winery, setWinery] = useState<WineryPublicProfileResponseDto | null>(null);
  const [pairings, setPairings] = useState<WineryWinePairingDto[]>([]);
  const [grapesList, setGrapesList] = useState<GrapeResponseDto[]>([]);

  // Marcas del usuario
  const [marks, setMarks] = useState<UserWineMarksResponseDto | null>(null);
  const [isUpdatingWanted, setIsUpdatingWanted] = useState<boolean>(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState<boolean>(false);

  // Foto personal de la cosecha activa
  const [personalImageId, setPersonalImageId] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState<boolean>(false);

  // Reseñas de la cosecha activa
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const REVIEWS_PER_PAGE = 3;

  // Formulario de reseña (enteras 1 a 5)
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState<boolean>(false);
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState<boolean>(false);

  // Modal Guardar en Cava
  const [isAddToCellarOpen, setIsAddToCellarOpen] = useState(false);

  // Notificaciones Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, actionLabel?: string, actionTo?: string, isError = false) => {
    setToast({ message, actionLabel, actionTo, isError });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  // Cosecha activa seleccionada
  const activeVintage = useMemo<WineVintageResponseDto | null>(() => {
    if (vintages.length === 0) return null;
    if (selectedVintageId !== null) {
      const match = vintages.find((v) => v.id === selectedVintageId);
      if (match) return match;
    }
    return vintages[0] ?? null;
  }, [vintages, selectedVintageId]);

  // Mapa de nombres de uvas para varietales
  const grapesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of grapesList) {
      map.set(g.id, g.name);
    }
    return map;
  }, [grapesList]);

  // Reseña previa del usuario activo para la cosecha seleccionada (cálculo derivado directo)
  const myReview = (!user?.id || reviews.length === 0)
    ? null
    : (reviews.find((r) => r.userId === user.id) || null);

  // Carga inicial del vino y metadatos generales
  useEffect(() => {
    if (wineId === null) return;

    let isCancelled = false;

    Promise.all([
      getWineById(wineId),
      getWineVintages(wineId),
      getGrapes({ pageSize: 100 }).catch(() => [] as GrapeResponseDto[]),
      getWinePairings(wineId).catch(() => [] as WineryWinePairingDto[]),
      isAuthenticated ? getMyWineMarks(wineId).catch(() => null) : Promise.resolve(null),
    ])
      .then(async ([wineData, rawVintages, grapesData, winePairings, userMarks]) => {
        if (isCancelled) return;

        let wineryProfile: WineryPublicProfileResponseDto | null = null;
        if (wineData.wineryId) {
          try {
            wineryProfile = await getWineryPublicProfile(wineData.wineryId);
          } catch {
            wineryProfile = null;
          }
        }
        if (isCancelled) return;

        const sortedVintages = [...rawVintages].sort((a, b) => {
          if (a.year === null && b.year === null) return 0;
          if (a.year === null) return 1;
          if (b.year === null) return -1;
          return b.year - a.year;
        });

        setWine(wineData);
        setGrapesList(grapesData);
        setPairings(winePairings);
        setVintages(sortedVintages);
        setSelectedVintageId(sortedVintages[0]?.id ?? null);
        setWinery(wineryProfile);
        setMarks(userMarks);
        setIsNotFoundResponse(false);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr.response?.status === 404) {
            setIsNotFoundResponse(true);
            return;
          }
        }
        setLoadError('No se pudo cargar la información del vino. Comprobá tu conexión a internet.');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [wineId, isAuthenticated, reloadTrigger]);

  // Carga de reseñas y foto personal al cambiar de cosecha activa
  useEffect(() => {
    if (!wineId || selectedVintageId === null) return;

    let isCancelled = false;
    const vId = selectedVintageId;

    Promise.all([
      getVintageReviews(vId, { pageSize: 100 }).catch(() => [] as ReviewResponseDto[]),
      isAuthenticated ? getMyVintageImage(wineId, vId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([vintageReviews, photoId]) => {
        if (isCancelled) return;
        setReviews(vintageReviews);
        setPersonalImageId(photoId);
        setCurrentPage(1);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingReviews(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [wineId, selectedVintageId, isAuthenticated]);

  // Refrescar cosecha tras cambios de reseñas (Regla Central: totales provienen del backend)
  const refreshVintageTotals = useCallback(async (vId: number) => {
    if (!wineId) return;
    try {
      const updatedVintage = await getWineVintageById(wineId, vId);
      setVintages((prev) => prev.map((v) => (v.id === vId ? updatedVintage : v)));
      const updatedReviews = await getVintageReviews(vId, { pageSize: 100 });
      setReviews(updatedReviews);
    } catch {
      // Ignorar fallos transitorios
    }
  }, [wineId]);

  // Interacción: Alternar Deseado (Optimista con Reversión)
  const handleToggleWanted = async () => {
    if (!isAuthenticated) {
      showToast('Iniciá sesión para guardar este vino en tu lista de deseados.', undefined, undefined, true);
      return;
    }
    if (!wineId || isUpdatingWanted) return;

    const previousMarks = marks;
    const newWantedState = !previousMarks?.isWanted;

    setMarks((prev) =>
      prev
        ? { ...prev, isWanted: newWantedState }
        : { wineId, isWanted: newWantedState, isTried: false, isFavorite: false },
    );
    setIsUpdatingWanted(true);

    try {
      if (previousMarks?.isWanted) {
        await unmarkWineAsWanted(wineId);
        showToast('Vino retirado de tu lista de deseados.');
      } else {
        await markWineAsWanted(wineId);
        showToast('¡Vino agregado a tu lista de deseados!');
      }
    } catch {
      setMarks(previousMarks);
      showToast('No se pudo actualizar la lista de deseados. Reintentá.', undefined, undefined, true);
    } finally {
      setIsUpdatingWanted(false);
    }
  };

  // Interacción: Alternar Favorito (Optimista con Reversión)
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Iniciá sesión para agregar este vino a tus favoritos.', undefined, undefined, true);
      return;
    }
    if (!wineId || isUpdatingFavorite) return;

    const previousMarks = marks;
    const newFavoriteState = !previousMarks?.isFavorite;

    setMarks((prev) =>
      prev
        ? { ...prev, isFavorite: newFavoriteState }
        : { wineId, isWanted: false, isTried: false, isFavorite: newFavoriteState },
    );
    setIsUpdatingFavorite(true);

    try {
      if (previousMarks?.isFavorite) {
        await unmarkWineAsFavorite(wineId);
        showToast('Vino retirado de tus favoritos.');
      } else {
        await markWineAsFavorite(wineId);
        showToast('¡Vino agregado a tus favoritos!');
      }
    } catch {
      setMarks(previousMarks);
      showToast('No se pudo actualizar la lista de favoritos. Reintentá.', undefined, undefined, true);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  // Interacción: Compartir Ficha
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Enlace de la ficha enológica copiado al portapapeles.');
    } else {
      showToast('Enlace listo para compartir.');
    }
  };

  // Interacción: Subida de Foto Personal
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wineId || !activeVintage) return;

    // Validación de tipo y tamaño (máximo 5MB)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Formato de imagen inválido. Solo se admiten archivos JPG, PNG o WEBP.', undefined, undefined, true);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen supera el límite de 5 MB.', undefined, undefined, true);
      e.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const newImageId = await uploadMyVintageImage(wineId, activeVintage.id, file);
      setPersonalImageId(newImageId);
      showToast('Foto personal guardada correctamente.');
    } catch {
      showToast('No se pudo subir tu foto personal. Reintentá más tarde.', undefined, undefined, true);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Interacción: Borrado de Foto Personal
  const handleDeletePersonalPhoto = async () => {
    if (!wineId || !activeVintage || isDeletingPhoto) return;

    setIsDeletingPhoto(true);
    try {
      await deleteMyVintageImage(wineId, activeVintage.id);
      setPersonalImageId(null);
      showToast('Foto personal eliminada.');
    } catch {
      showToast('No se pudo eliminar tu foto personal.', undefined, undefined, true);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Interacción: Publicar / Editar Reseña
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!wineId || !activeVintage) return;

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      setReviewFormError('La calificación debe ser un número entero entre 1 y 5 estrellas.');
      return;
    }

    if (comment.length > 1000) {
      setReviewFormError('El comentario no puede superar los 1000 caracteres.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewFormError(null);

    try {
      if (myReview) {
        await updateReview(myReview.id, {
          rating,
          comment: comment.trim() || null,
        });
        showToast('Tu reseña fue actualizada exitosamente.');
      } else {
        await createReview({
          wineVintageId: activeVintage.id,
          rating,
          comment: comment.trim() || null,
        });
        showToast('¡Tu reseña fue publicada exitosamente!');
      }

      setIsReviewFormOpen(false);
      await refreshVintageTotals(activeVintage.id);
    } catch (err: unknown) {
      let msg = 'Ocurrió un error al guardar tu reseña.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
        if (axiosErr.response?.status === 409) {
          msg = 'Ya registraste una reseña para esta cosecha. Podés editarla.';
        } else if (axiosErr.response?.data?.detail) {
          msg = axiosErr.response.data.detail;
        } else if (axiosErr.response?.data?.title) {
          msg = axiosErr.response.data.title;
        }
      }
      setReviewFormError(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Interacción: Eliminar Reseña Propia
  const handleDeleteReview = async () => {
    if (!myReview || !activeVintage || isDeletingReview) return;

    setIsDeletingReview(true);
    try {
      await deleteReview(myReview.id);
      showToast('Tu reseña fue eliminada.');
      setIsReviewFormOpen(false);
      setShowDeleteReviewConfirm(false);
      await refreshVintageTotals(activeVintage.id);
    } catch {
      showToast('No se pudo eliminar la reseña. Reintentá.', undefined, undefined, true);
    } finally {
      setIsDeletingReview(false);
    }
  };

  // Reseñas filtradas visualmente (sin alterar totales centrales)
  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    const targetStar = parseInt(starFilter, 10);
    return reviews.filter((rev) => rev.rating === targetStar);
  }, [reviews, starFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));

  const displayedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  // Pantalla de Carga
  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center p-6 pt-28">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          <span className="text-xs font-mono text-neutral-400 tracking-wider uppercase">
            Cargando ficha enológica...
          </span>
        </div>
      </main>
    );
  }

  // Pantalla de Error de Red con Reintento
  if (loadError) {
    return (
      <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center p-6 pt-28">
        <div className="max-w-md w-full bg-neutral-900/40 border border-rose-900/40 rounded-lg p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="text-xl font-serif text-neutral-100 font-bold">Error de conexión</h1>
          <p className="text-xs text-neutral-400 font-sans">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              setReloadTrigger((prev) => prev + 1);
            }}
            className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium uppercase tracking-wider rounded-sm bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Pantalla de Vino No Encontrado (404 o ID no numérico)
  if (isNotFound || !wine) {
    return (
      <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center p-6 pt-28">
        <div className="max-w-md w-full bg-neutral-900/40 border border-neutral-800 rounded-lg p-8 text-center space-y-4 shadow-xl">
          <Wine className="w-12 h-12 text-rose-300/80 mx-auto stroke-[1.25]" />
          <h1 className="text-2xl font-serif text-neutral-100 font-bold">Vino no encontrado</h1>
          <p className="text-sm text-neutral-400 font-sans">
            La etiqueta solicitada no existe o fue retirada del catálogo oficial.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard#catalogo"
              className="inline-flex items-center justify-center h-10 px-5 text-xs font-medium uppercase tracking-wider rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 transition-colors"
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] antialiased selection:bg-[#722f37] selection:text-white pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navegación de Retorno Minimalista */}
        <div className="mb-8">
          <Link
            to="/dashboard#catalogo"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            ← Volver al catálogo
          </Link>
        </div>

        {/* 1. SECCIÓN PRINCIPAL: Grid de 2 Columnas (5 y 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA (lg:col-span-5): Botella, Acciones & Bodega */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 flex flex-col lg:sticky lg:top-28 space-y-6">
            {/* Contenedor Visual de la Botella */}
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-lg p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center group">
              <div
                aria-hidden="true"
                className="absolute w-72 h-80 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-rose-950/5 to-transparent blur-2xl pointer-events-none group-hover:from-rose-900/30 transition-all duration-700"
              />

              <div className="w-full h-84 sm:h-96 flex items-center justify-center relative z-10 py-6">
                {activeVintage?.imageId ? (
                  <img
                    src={imageUrl(activeVintage.imageId, 'bottle')!}
                    alt={`${wine.name} Cosecha ${activeVintage.year ?? 'Sin añada'}`}
                    className="max-h-full object-contain filter drop-shadow-[0_28px_45px_rgba(0,0,0,0.95)] transition-transform duration-700 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs border-y border-neutral-800/80">
                    <Wine className="w-10 h-10 text-rose-300/80 stroke-[1.25] mb-3" />
                    <span className="font-serif text-base text-neutral-200">
                      {activeVintage ? `Cosecha ${activeVintage.year ?? 'Sin añada'}` : 'Botella en Catálogo'}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1 font-mono">
                      Ficha enológica comunitaria
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Control "Mi Foto Personal" */}
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-rose-300" />
                  <span>Mi foto de esta cosecha</span>
                </span>
                {personalImageId && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                    Guardada
                  </span>
                )}
              </div>

              {isAuthenticated ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Seleccionar foto personal"
                  />

                  {personalImageId ? (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                        <img
                          src={imageUrl(personalImageId, 'bottle')!}
                          alt="Mi foto personal"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto || isDeletingPhoto}
                          className="h-7 px-3 text-[11px] font-mono uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 hover:bg-neutral-800/40 text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                          <span>Reemplazar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDeletePersonalPhoto}
                          disabled={isUploadingPhoto || isDeletingPhoto}
                          className="h-7 px-3 text-[11px] font-mono uppercase tracking-wider transition-colors rounded-sm border border-red-900/40 hover:bg-red-950/40 text-red-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          <span>Quitar foto</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full h-9 px-3 text-xs font-mono uppercase tracking-wider transition-colors rounded-sm border border-dashed border-neutral-700/80 hover:border-rose-700/80 hover:bg-rose-950/20 text-neutral-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                          <span>Subiendo foto...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Agregar mi foto</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 font-sans">
                  Iniciá sesión para guardar una foto personal de tu botella.
                </p>
              )}
            </div>

            {/* Botones de Acción Principales */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Guardar en cava */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      showToast('Iniciá sesión para guardar este vino en tu cava.', undefined, undefined, true);
                      return;
                    }
                    setIsAddToCellarOpen(true);
                  }}
                  className="h-10 px-4 text-xs font-medium uppercase tracking-wider rounded-sm bg-[#722F37] hover:bg-[#85222e] border border-rose-500/40 text-white flex items-center justify-center gap-2 w-full transition-colors cursor-pointer shadow-sm"
                >
                  <BookmarkPlus className="w-4 h-4 text-white" />
                  <span>Guardar en cava</span>
                </button>

                {/* Escribir / Editar reseña */}
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen((prev) => !prev)}
                  className="h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-neutral-400" />
                  <span>{myReview ? 'Editar mi reseña' : 'Escribir reseña'}</span>
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

            {/* Selector de Añadas Disponibles */}
            <div className="space-y-2 pt-2">
              <span className="text-xs tracking-widest text-neutral-400 uppercase font-medium block">
                Añadas disponibles
              </span>
              <div className="flex flex-wrap gap-2">
                {vintages.map((vintage) => {
                  const isSelected = vintage.id === activeVintage?.id;
                  const isPending = vintage.approvalStatus === 'Pending';
                  return (
                    <button
                      key={vintage.id}
                      type="button"
                      onClick={() => {
                        setSelectedVintageId(vintage.id);
                        setIsLoadingReviews(true);
                      }}
                      className={`rounded-sm px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-neutral-800 border border-neutral-600 text-white'
                          : 'border border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span>{vintage.year !== null ? vintage.year : 'Sin añada'}</span>
                      {isPending && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Sin verificar
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloque de Bodega & Terruño */}
            <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-6 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                Bodega Elaboradora
              </span>

              {wine.wineryId && winery ? (
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/bodegas/${wine.wineryId}`}
                      className="font-serif text-2xl text-neutral-100 font-semibold tracking-tight hover:text-amber-200 transition-colors flex items-center justify-between group/winery"
                    >
                      <span>{winery.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover/winery:text-amber-200 transition-transform group-hover/winery:translate-x-0.5 group-hover/winery:-translate-y-0.5" />
                    </Link>
                    {(winery.location?.regionName || winery.location?.stateName) && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-sans mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-300" />
                        <span>
                          {[winery.location.regionName, winery.location.stateName].filter(Boolean).join(', ')}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-xs font-mono text-neutral-400">
                    {winery.foundationYear && (
                      <div className="flex items-center justify-between">
                        <span>Fundación histórica:</span>
                        <strong className="text-neutral-200 font-normal">{winery.foundationYear}</strong>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-amber-300/90 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Bodega oficial verificada</span>
                    </div>
                  </div>

                  {winery.website && (
                    <div className="pt-1">
                      <a
                        href={winery.website.startsWith('http') ? winery.website : `https://${winery.website}`}
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
                  <p className="font-serif text-xl text-neutral-200">
                    {wine.wineryNameText || 'Productor independiente'}
                  </p>
                  <p className="text-neutral-500 text-[11px] font-sans">
                    Vino comunitario cargado por la comunidad de AyVino.
                  </p>
                </div>
              )}
            </div>

            {/* Sello de trazabilidad al pie */}
            <p className="text-[11px] text-neutral-500 font-mono text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Trazabilidad y estiba enológica en AyVino</span>
            </p>
          </aside>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA (lg:col-span-7): Header, Specs & Varietal */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 flex flex-col space-y-6">
            {/* Header del Vino con Marcas */}
            <header className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-rose-300 uppercase font-semibold">
                  <span>{getWineTypeLabel(wine.wineType)}</span>
                  <span className="text-neutral-600" aria-hidden="true">·</span>
                  <span className="text-neutral-400 font-normal">
                    {activeVintage?.year !== null && activeVintage?.year !== undefined
                      ? `Cosecha ${activeVintage.year}`
                      : 'Sin añada'}
                  </span>
                  {activeVintage?.approvalStatus === 'Pending' && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Sin verificar
                    </span>
                  )}
                </div>

                {/* Controles de Marcas Personales (Deseado, Favorito, Probado) */}
                <div className="flex items-center gap-2">
                  {marks?.isTried && (
                    <div
                      className="h-8 px-2.5 text-[11px] font-mono uppercase tracking-wider rounded-sm bg-neutral-900 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5 cursor-default select-none"
                      title="Vino registrado como probado en tu historial"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Probado</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleWanted}
                    disabled={isUpdatingWanted}
                    aria-label={marks?.isWanted ? 'Quitar de deseados' : 'Marcar como deseado'}
                    className={`h-8 px-3 text-[11px] font-mono uppercase tracking-wider transition-colors rounded-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      marks?.isWanted
                        ? 'bg-rose-950/50 border border-rose-700/70 text-rose-200'
                        : 'border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${marks?.isWanted ? 'fill-rose-300 text-rose-300' : ''}`} />
                    <span>Deseado</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={isUpdatingFavorite}
                    aria-label={marks?.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                    className={`h-8 px-3 text-[11px] font-mono uppercase tracking-wider transition-colors rounded-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      marks?.isFavorite
                        ? 'bg-rose-950/50 border border-rose-700/70 text-rose-200'
                        : 'border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${marks?.isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>Favorito</span>
                  </button>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
                {wine.name}
              </h1>

              <p className="text-sm text-neutral-400 font-sans">
                Elaborado por{' '}
                <span className="text-neutral-200 font-medium">
                  {winery?.name || wine.wineryNameText || 'Productor independiente'}
                </span>
              </p>
            </header>

            {/* Tira de Especificaciones Técnicas (Regla Central: puntaje de cosecha) */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-3 border-y border-neutral-800/80">
              {/* Calificación de la cosecha activa */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Calificación
                </span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {activeVintage?.averageRating !== null && activeVintage?.averageRating !== undefined ? (
                    <>
                      <span className="text-sm font-medium text-neutral-200 font-mono">
                        {activeVintage.averageRating.toFixed(1)}
                      </span>
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        ({activeVintage.reviewCount})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-neutral-500">
                      Sin reseñas suficientes ({activeVintage?.reviewCount ?? 0})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Graduación
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {activeVintage?.alcoholContent ? `${activeVintage.alcoholContent}%` : 'N/D'}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Servicio
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {activeVintage?.servingTemperature ? `${activeVintage.servingTemperature}°C` : 'N/D'}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Guarda
                </span>
                <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                  {getConciseAging(activeVintage?.agingAdvice)}
                </span>
              </div>
            </div>

            {/* Composición Varietal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Composición Varietal
                </h2>
                <span className="text-xs font-mono text-neutral-500">
                  {activeVintage?.year !== null && activeVintage?.year !== undefined
                    ? `Añada ${activeVintage.year}`
                    : 'Sin añada'}
                </span>
              </div>

              {activeVintage && activeVintage.grapes && activeVintage.grapes.length > 0 ? (
                <>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-900 border border-neutral-800/60">
                    {activeVintage.grapes.map((grape, i) => {
                      const colors = ['bg-[#722f37]', 'bg-[#b43747]', 'bg-[#e3aa00]', 'bg-[#d8c1c2]'];
                      const pct = grape.percentage ?? (100 / activeVintage.grapes.length);
                      return (
                        <div
                          key={grape.grapeId}
                          style={{ width: `${pct}%` }}
                          className={`${colors[i % colors.length]} h-full transition-all duration-500`}
                          title={`${grapesMap.get(grape.grapeId) || `Varietal #${grape.grapeId}`}${grape.percentage !== null ? `: ${grape.percentage}%` : ''}`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                    {activeVintage.grapes.map((grape, i) => {
                      const dotColors = ['text-rose-300', 'text-amber-400', 'text-rose-200'];
                      const grapeName = grapesMap.get(grape.grapeId) || `Varietal #${grape.grapeId}`;
                      return (
                        <div key={grape.grapeId} className="flex items-center gap-2">
                          <span className={dotColors[i % dotColors.length]} aria-hidden="true">●</span>
                          <span className="text-neutral-200 font-medium">{grapeName}</span>
                          {grape.percentage !== null && grape.percentage !== undefined && (
                            <span className="font-mono text-neutral-400">{grape.percentage}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-neutral-500 font-mono">
                  Composición varietal no declarada para esta cosecha.
                </p>
              )}
            </div>

            {/* Descripción & Terruño */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                Descripción & Terruño
              </h2>
              <p className="text-base text-neutral-300 leading-relaxed font-sans font-light">
                {wine.description || 'Sin notas descriptivas disponibles para esta etiqueta.'}
              </p>
            </div>

            {/* Maridajes Sugeridos */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Maridajes Sugeridos
                </h2>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">Armonías recomendadas</span>
              </div>

              {pairings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pairings.map((p, idx) => (
                    <div
                      key={p.id}
                      className="group rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-3.5 space-y-2 hover:border-rose-900/60 hover:bg-neutral-900/70 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-sm bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center group-hover:border-rose-300/40 transition-colors">
                          {getPairingIcon(p.category)}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          Armonía 0{idx + 1}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-base text-neutral-100 font-semibold tracking-tight group-hover:text-amber-200 transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-neutral-400 font-sans mt-0.5 leading-relaxed">
                          Categoría: {p.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-neutral-900/20 border border-neutral-800/40 p-4 text-xs font-mono text-neutral-500 text-center">
                  Aún no se han registrado maridajes gastronómicos para esta etiqueta.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 2. SECCIÓN: Reseñas de la Comunidad (Ancho completo) */}
        <section id="reviews-editorial-section" className="border-t border-neutral-800/80 pt-12 mt-12">
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-neutral-100 font-semibold tracking-tight">
                  Catas & Bitácora de la Comunidad
                </h2>
                <p className="text-xs text-neutral-400 mt-1 font-mono">
                  {activeVintage?.reviewCount ?? 0}{' '}
                  {(activeVintage?.reviewCount ?? 0) === 1
                    ? 'anotación enológica verificada'
                    : 'anotaciones enológicas verificadas'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {myReview && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteReviewConfirm(true)}
                    className="rounded-sm border border-red-900/50 bg-red-950/20 text-red-300 hover:bg-red-900/30 text-xs uppercase tracking-wider px-3 py-2 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar mi reseña</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      showToast('Iniciá sesión para registrar o editar una reseña.', undefined, undefined, true);
                      return;
                    }
                    setIsReviewFormOpen((prev) => !prev);
                  }}
                  className="rounded-sm border border-rose-800/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40 text-xs uppercase tracking-wider px-3.5 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {isReviewFormOpen
                      ? 'Cerrar formulario'
                      : myReview
                        ? 'Editar mi reseña'
                        : '+ Registrar mi cata'}
                  </span>
                </button>
              </div>
            </div>

            {/* Modal de confirmación para eliminar reseña */}
            {showDeleteReviewConfirm && (
              <div className="bg-red-950/30 border border-red-800/60 rounded-lg p-4 space-y-3 animate-in fade-in">
                <p className="text-xs text-red-200 font-sans">
                  ¿Estás seguro de que querés eliminar tu reseña? Esta acción no se puede deshacer.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={isDeletingReview}
                    className="h-8 px-3 text-xs font-mono uppercase tracking-wider rounded-sm bg-red-800 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingReview && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Confirmar eliminación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteReviewConfirm(false)}
                    className="h-8 px-3 text-xs font-mono uppercase tracking-wider rounded-sm border border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Formulario de Reseña (Calificación con 1-5 estrellas enteras) */}
            {isReviewFormOpen && (
              <ReviewForm
                key={`${activeVintage?.id ?? 'none'}-${myReview?.id ?? 'new'}`}
                myReview={myReview}
                vintageYear={activeVintage?.year ?? null}
                username={user?.username}
                isSubmitting={isSubmittingReview}
                formError={reviewFormError}
                onClose={() => setIsReviewFormOpen(false)}
                onSubmit={handleSubmitReview}
              />
            )}

            {/* Filtro por estrellas */}
            <div className="flex items-center justify-between py-2 border-b border-neutral-900 text-xs font-mono text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-wider text-neutral-500">Filtrar:</span>
                {(
                  [
                    { id: 'all', label: 'Todas' },
                    { id: '5', label: '5 ★' },
                    { id: '4', label: '4 ★' },
                    { id: '3', label: '3 ★' },
                    { id: '2', label: '2 ★' },
                    { id: '1', label: '1 ★' },
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

            {/* Nota si reviewCount del backend es mayor a lo cargado */}
            {activeVintage && activeVintage.reviewCount > reviews.length && (
              <p className="text-[11px] font-mono text-neutral-500 bg-neutral-950 p-2.5 border border-neutral-800/50 rounded">
                Se muestran las {reviews.length} reseñas más recientes de un total de {activeVintage.reviewCount}{' '}
                registradas para esta cosecha.
              </p>
            )}

            {/* Feed de reseñas */}
            <div className="space-y-3">
              {isLoadingReviews ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-mono text-neutral-500">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                  <span>Cargando catas comunitarias...</span>
                </div>
              ) : displayedReviews.length > 0 ? (
                displayedReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-serif text-neutral-300 flex items-center justify-center font-semibold shrink-0">
                          {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-200 block">
                              {rev.userName}
                            </span>
                            {user?.id === rev.userId && (
                              <span className="text-[9px] font-mono uppercase bg-rose-950/60 border border-rose-800/50 text-rose-300 px-1.5 py-0.2 rounded">
                                Tu reseña
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(rev.createdAt).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · Cosecha {rev.vintageYear ?? 'Sin añada'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs whitespace-nowrap">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={i < rev.rating ? 'text-amber-400' : 'text-neutral-700'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-neutral-200 text-xs font-semibold">
                          {rev.rating} / 5
                        </span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                        {rev.comment}
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <div className="py-10 text-center text-xs font-mono text-neutral-500 bg-neutral-900/20 border border-neutral-800/40 rounded-lg">
                  No hay reseñas registradas para el filtro seleccionado.
                </div>
              )}
            </div>

            {/* Paginación de reseñas */}
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
        </section>

        {/* Modal Guardar en Cava */}
        {isAddToCellarOpen && activeVintage && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          >
            <div className="bg-[#16161b] border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-serif text-lg font-semibold text-neutral-100">
                  Guardar en mi Cava
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddToCellarOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AddToCellarForm
                wine={{
                  wineId: wine.id,
                  wineVintageId: activeVintage.id,
                  wineName: wine.name,
                  vintageYear: activeVintage.year,
                  wineryName: wine.wineryNameText || winery?.name,
                  wineType: wine.wineType,
                  approvalStatus: activeVintage.approvalStatus,
                }}
                onDone={(res) => {
                  setIsAddToCellarOpen(false);
                  showToast(
                    `Agregaste ${res.quantityAdded} ${res.quantityAdded === 1 ? 'botella' : 'botellas'} a «${res.cellarName}»`,
                    'Ver mi cava',
                    `/cava?cava=${res.cellarId}`
                  );
                }}
                onCancel={() => setIsAddToCellarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Notificación Toast Flotante */}
        {toast && (
          <aside
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 bg-neutral-900/95 backdrop-blur-md border ${
              toast.isError ? 'border-red-800/80 text-red-200' : 'border-neutral-800 text-white'
            } text-xs px-5 py-3.5 shadow-2xl flex items-center gap-3 font-mono rounded-sm animate-in slide-in-from-bottom-5 duration-200`}
          >
            {toast.isError ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
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
