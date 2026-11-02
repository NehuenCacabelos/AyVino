import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Settings,
  Wine,
  History,
  Bookmark,
  Building2,
  UserPlus,
  UserCheck,
  Star,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Plus,
  MapPin,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import ProfileTopBar from '../components/layout/ProfileTopBar';
import { getAvatarUrl } from '../lib/avatar';
import { imageUrl } from '../lib/image';
import {
  getPublicUserProfileApi,
  getPublicCellarItemsApi,
  followUserApi,
  unfollowUserApi,
  getMyFollowingUsersApi,
  getMyCellarsApi,
  getCellarItemsApi,
  getMyUserWinesApi,
  getMyHistoryApi,
  getMyFollowingWineriesApi,
  type PublicUserProfileDto,
  type PublicCellarItemDto,
  type CellarItemDto,
  type UserWineListItemDto,
  type HistoryItemDto,
  type FollowingWineryDto,
} from '../features/users';
import { unfollowWinery } from '../features/winery/api/wineryApi';
import { cn } from '../lib/utils';
import WineBottleSilhouette from '../features/wines/components/WineBottleSilhouette';
import ConfirmDialog from '../features/admin/components/ConfirmDialog';
import { getBannerThemeByUsername } from '../constants/bannerThemes';

const PAGE_SIZE = 12;

function ShowcaseWineBottle({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <WineBottleSilhouette className="w-8 h-20 text-neutral-500 transition-transform duration-300 group-hover:scale-105" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
}

type OwnerTab = 'cava' | 'historial' | 'deseados' | 'bodegas';

const ACTIVITY_TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  Uncorked: {
    label: 'Descorchó',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
  },
  Reviewed: {
    label: 'Reseñó',
    badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
  },
  AddedToCellar: {
    label: 'Agregó a su cava',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
  },
  WineContributed: {
    label: 'Cargó un vino',
    badgeClass: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
  },
};

const HISTORY_FILTER_CHIPS = [
  { label: 'Todos', value: '' },
  { label: 'Descorchados', value: 'Uncorked' },
  { label: 'Reseñas', value: 'Reviewed' },
  { label: 'Cava', value: 'AddedToCellar' },
  { label: 'Cargados', value: 'WineContributed' },
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null);

  // Vista visitante: follow state & public wines
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [publicWines, setPublicWines] = useState<PublicCellarItemDto[]>([]);
  const [publicWinesLoading, setPublicWinesLoading] = useState(false);

  // Vista owner: pestañas & datos
  const [activeTab, setActiveTab] = useState<OwnerTab>('cava');
  const [ownerCellarItems, setOwnerCellarItems] = useState<CellarItemDto[]>([]);
  const [ownerFavWines, setOwnerFavWines] = useState<UserWineListItemDto[]>([]);
  const [ownerDataLoading, setOwnerDataLoading] = useState(false);

  // Historial del owner (GET /api/users/me/history)
  const [historyItems, setHistoryItems] = useState<HistoryItemDto[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);

  // Bodegas que sigo del owner (GET /api/users/me/following-wineries)
  const [followingWineries, setFollowingWineries] = useState<FollowingWineryDto[]>([]);
  const [wineriesPage, setWineriesPage] = useState(1);
  const [hasMoreWineries, setHasMoreWineries] = useState(false);
  const [wineriesLoadingMore, setWineriesLoadingMore] = useState(false);
  const [wineriesError, setWineriesError] = useState<string | null>(null);
  const [unfollowTarget, setUnfollowTarget] = useState<FollowingWineryDto | null>(null);
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);

  // Toast / feedback contextual
  const [toastMessage, setToastMessage] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage({ message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const isOwner = Boolean(
    currentUser &&
    username &&
    currentUser.username?.toLowerCase() === username.toLowerCase()
  );

  const activeTheme = useMemo(() => {
    return getBannerThemeByUsername(profile?.username ?? username);
  }, [profile?.username, username]);

  // Cargar información de perfil
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!username) {
        if (currentUser?.username) {
          navigate(`/perfil/${currentUser.username}`, { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getPublicUserProfileApi(username);
        if (!isMounted) return;
        setProfile(data);

        // Si es visitante autenticado, verificar si lo sigue
        if (currentUser && currentUser.username?.toLowerCase() !== username.toLowerCase()) {
          try {
            const followingList = await getMyFollowingUsersApi();
            if (isMounted) {
              const follows = followingList.some((f) => f.userId === data.id);
              setIsFollowing(follows);
            }
          } catch {
            // Ignorar error secundario de verificación
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        let msg = 'No se pudo conectar con el servidor.';
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            msg = 'El usuario solicitado no existe o no se encuentra disponible.';
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            msg = 'No tenés permisos para ver este perfil.';
          } else {
            msg = 'Ocurrió un error al cargar el perfil.';
          }
        }
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [username, currentUser, navigate]);

  // Cargar vinos públicos si es visitante
  const profileUsername = profile?.username;

  useEffect(() => {
    if (!profileUsername || isOwner) return;

    const targetUsername = profileUsername;
    let isMounted = true;
    async function loadPublicWines() {
      setPublicWinesLoading(true);
      try {
        const wines = await getPublicCellarItemsApi(targetUsername);
        if (isMounted) setPublicWines(wines);
      } catch {
        if (isMounted) setPublicWines([]);
      } finally {
        if (isMounted) setPublicWinesLoading(false);
      }
    }

    void loadPublicWines();
    return () => {
      isMounted = false;
    };
  }, [profileUsername, isOwner]);

  // Cargar datos del owner según pestaña activa
  const profileId = profile?.id;
  useEffect(() => {
    if (!isOwner || !profileId) return;

    let isMounted = true;
    async function loadOwnerData() {
      setOwnerDataLoading(true);
      try {
        if (activeTab === 'cava') {
          const cellars = await getMyCellarsApi();
          if (cellars.length > 0) {
            const items = await getCellarItemsApi(cellars[0].id);
            if (isMounted) setOwnerCellarItems(items);
          } else {
            if (isMounted) setOwnerCellarItems([]);
          }
        } else if (activeTab === 'historial') {
          setHistoryPage(1);
          const history = await getMyHistoryApi({
            pageNumber: 1,
            pageSize: PAGE_SIZE,
            type: historyTypeFilter || undefined,
          });
          if (isMounted) {
            setHistoryItems(history);
            setHasMoreHistory(history.length === PAGE_SIZE);
          }
        } else if (activeTab === 'deseados') {
          const [wanted, fav] = await Promise.all([
            getMyUserWinesApi({ wanted: true }),
            getMyUserWinesApi({ favorite: true }),
          ]);
          // Combinar sin duplicados
          const combinedMap = new Map<number, UserWineListItemDto>();
          wanted.forEach((w) => combinedMap.set(w.wineId, w));
          fav.forEach((w) => combinedMap.set(w.wineId, w));
          if (isMounted) setOwnerFavWines(Array.from(combinedMap.values()));
        } else if (activeTab === 'bodegas') {
          setWineriesPage(1);
          setWineriesError(null);
          const wineries = await getMyFollowingWineriesApi({
            pageNumber: 1,
            pageSize: PAGE_SIZE,
          });
          if (isMounted) {
            setFollowingWineries(wineries);
            setHasMoreWineries(wineries.length === PAGE_SIZE);
          }
        }
      } catch {
        if (activeTab === 'bodegas' && isMounted) {
          setWineriesError('Error al cargar las bodegas que seguís.');
        }
      } finally {
        if (isMounted) setOwnerDataLoading(false);
      }
    }

    void loadOwnerData();
    return () => {
      isMounted = false;
    };
  }, [isOwner, profileId, activeTab, historyTypeFilter]);

  // Cargar más actividades del historial
  const handleLoadMoreHistory = async () => {
    if (historyLoadingMore || !hasMoreHistory) return;
    setHistoryLoadingMore(true);
    const nextPage = historyPage + 1;

    try {
      const more = await getMyHistoryApi({
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
        type: historyTypeFilter || undefined,
      });
      setHistoryItems((prev) => [...prev, ...more]);
      setHistoryPage(nextPage);
      setHasMoreHistory(more.length === PAGE_SIZE);
    } catch {
      showToast('Error al cargar más actividades.', true);
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  // Cargar más bodegas
  const handleLoadMoreWineries = async () => {
    if (wineriesLoadingMore || !hasMoreWineries) return;
    setWineriesLoadingMore(true);
    const nextPage = wineriesPage + 1;

    try {
      const more = await getMyFollowingWineriesApi({
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
      });
      setFollowingWineries((prev) => [...prev, ...more]);
      setWineriesPage(nextPage);
      setHasMoreWineries(more.length === PAGE_SIZE);
    } catch {
      showToast('Error al cargar más bodegas.', true);
    } finally {
      setWineriesLoadingMore(false);
    }
  };

  // Dejar de seguir bodega con actualización optimista y rollback
  const handleConfirmUnfollowWinery = async () => {
    if (!unfollowTarget) return;

    const target = unfollowTarget;
    setUnfollowTarget(null);
    setUnfollowingId(target.wineryId);

    // Snapshot para rollback
    const previousWineries = [...followingWineries];

    // Actualización optimista inmediata
    setFollowingWineries((prev) => prev.filter((w) => w.wineryId !== target.wineryId));
    setProfile((prev) =>
      prev ? { ...prev, followingCount: Math.max(0, prev.followingCount - 1) } : null
    );

    try {
      await unfollowWinery(target.wineryId);
      showToast(`Dejaste de seguir a ${target.name}.`);
    } catch {
      // Revertir optimismo
      setFollowingWineries(previousWineries);
      setProfile((prev) =>
        prev ? { ...prev, followingCount: prev.followingCount + 1 } : null
      );
      showToast(`No se pudo dejar de seguir a ${target.name}. Por favor intentá de nuevo.`, true);
    } finally {
      setUnfollowingId(null);
    }
  };

  // "Joyas de la Cava": selección curada de las mejores botellas (hasta 8)
  const ownerShowcaseWines = useMemo(() => {
    return [...ownerCellarItems]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 8);
  }, [ownerCellarItems]);

  const publicShowcaseWines = useMemo(() => {
    return [...publicWines]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 8);
  }, [publicWines]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!profile || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUserApi(profile.id);
        setIsFollowing(false);
        setProfile((prev) =>
          prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null
        );
      } else {
        await followUserApi(profile.id);
        setIsFollowing(true);
        setProfile((prev) =>
          prev ? { ...prev, followersCount: prev.followersCount + 1 } : null
        );
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        navigate('/login');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-neutral-100 font-sans flex flex-col justify-between selection:bg-rose-900 selection:text-white">
      {/* 1. Top Bar Contextual Slim */}
      <ProfileTopBar
        backTo="/dashboard"
        backLabel="Volver a Explorar"
      />

      {/* 2. Contenido del Perfil con offset para ProfileTopBar fixed (h-14) */}
      <div className="flex-1 flex flex-col pt-14">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
            <p className="text-sm text-zinc-300 font-medium tracking-wide">Cargando perfil...</p>
          </div>
        ) : error || !profile ? (
          <div className="flex flex-col items-center justify-center py-36 text-center max-w-md mx-auto px-6">
            <div className="w-14 h-14 rounded-full bg-[#17151a] border border-white/15 flex items-center justify-center mb-5 text-rose-400">
              <Wine className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mb-2">Perfil no encontrado</h2>
            <p className="text-sm text-zinc-300 mb-6 font-sans">{error || 'El usuario especificado no existe.'}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#17151a] border border-white/15 hover:border-white/25 text-sm font-medium text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>Volver a Explorar</span>
            </Link>
          </div>
        ) : (
          <>
            {/* BANNER DINÁMICO */}
            <div
              className={cn(
                'relative w-full h-28 sm:h-32 md:h-36 overflow-hidden transition-colors duration-300',
                activeTheme.classes
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] via-transparent to-transparent pointer-events-none',
                  activeTheme.radialOverlayClass
                )}
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0b0e] to-transparent pointer-events-none" />
            </div>

            {/* CABECERA EXPANSIVA DE PERFIL */}
            <header className="w-full bg-[#0b0b0e] border-b border-white/10 pb-8">
              <div className="max-w-7xl mx-auto px-6">
                <div className="relative z-10 -mt-12 sm:-mt-14 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Bloque Izquierdo: Avatar + Nombre + Bio */}
                  <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-[#0b0b0e] shadow-2xl border border-white/15 bg-[#17151a] shrink-0">
                      <img
                        src={getAvatarUrl({ avatarImageId: profile.avatarImageId, photo: profile.photo, username: profile.username })}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAvatarUrl({ username: profile.username });
                        }}
                      />
                    </div>

                    <div className="max-w-2xl pt-1 sm:pt-2">
                      <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                        {profile.username}
                      </h1>

                      <p className="text-xs text-zinc-500 font-normal font-sans mt-1">
                        Miembro desde{' '}
                        {new Date(profile.registerDate).toLocaleDateString('es-AR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>

                      <div className="mt-3.5 max-w-xl">
                        <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                          {profile.bio && profile.bio.trim().length > 0 ? (
                            profile.bio
                          ) : (
                            <span className="italic text-zinc-500 text-xs sm:text-sm">Sin biografía disponible aún.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloque Derecho: Acciones y Métricas Consolidadas */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-end gap-3.5 pt-1 sm:pt-2">
                    {isOwner ? (
                      <Link
                        to="/cuenta"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#17151a] hover:bg-[#221f26] border border-white/15 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors shadow-sm"
                        title="Configuración de Cuenta"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Configuración</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleToggleFollow()}
                        disabled={followLoading}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-sans font-medium transition-all active:scale-[0.98]',
                          isFollowing
                            ? 'bg-[#17151a] hover:bg-[#221f26] border border-white/15 text-zinc-200'
                            : 'bg-[#6e1a24] hover:bg-[#831823] text-white border border-rose-700/50 shadow-md'
                        )}
                      >
                        {followLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Siguiendo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Seguir</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="bg-[#17151a]/90 border border-white/10 rounded-md px-5 py-2.5 flex items-center gap-6 sm:gap-7 shadow-sm">
                      <div className="text-center sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                          {profile.cellarWinesCount}
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-300 font-sans uppercase tracking-wider mt-1">
                          Cava
                        </div>
                      </div>
                      <div className="h-7 w-px bg-white/10" />
                      <div className="text-center sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                          {profile.followersCount}
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-300 font-sans uppercase tracking-wider mt-1">
                          Seguidores
                        </div>
                      </div>
                      <div className="h-7 w-px bg-white/10" />
                      <div className="text-center sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                          {profile.followingCount}
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-300 font-sans uppercase tracking-wider mt-1">
                          Siguiendo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* ÁREA PRINCIPAL DE CONTENIDO */}
            <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
              {isOwner ? (
                /* VISTA PROPIETARIO: 4 Pestañas */
                <div className="space-y-8">
                  {/* Barra de Pestañas Segmentadas */}
                  <div className="inline-flex p-1 bg-[#17151a] border border-white/10 rounded-md gap-1 overflow-x-auto max-w-full">
                    {/* 1. Joyas de la Cava */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('cava')}
                      className={cn(
                        'group px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-sans flex items-center gap-2 transition-all whitespace-nowrap',
                        activeTab === 'cava'
                          ? 'bg-[#6e1a24] text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium'
                      )}
                    >
                      <Wine
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          activeTab === 'cava' ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-200'
                        )}
                      />
                      <span>Joyas de la Cava</span>
                      <span
                        className={cn(
                          'text-xs font-mono px-1.5 py-0.5 rounded-sm',
                          activeTab === 'cava' ? 'bg-black/25 text-rose-100' : 'bg-[#0f0e13] text-zinc-400'
                        )}
                      >
                        {profile.cellarWinesCount}
                      </span>
                    </button>

                    {/* 2. Historial de Actividad */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('historial')}
                      className={cn(
                        'group px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-sans flex items-center gap-2 transition-all whitespace-nowrap',
                        activeTab === 'historial'
                          ? 'bg-[#6e1a24] text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium'
                      )}
                    >
                      <History
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          activeTab === 'historial' ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-200'
                        )}
                      />
                      <span>Historial</span>
                    </button>

                    {/* 3. Deseados & Favoritos */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('deseados')}
                      className={cn(
                        'group px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-sans flex items-center gap-2 transition-all whitespace-nowrap',
                        activeTab === 'deseados'
                          ? 'bg-[#6e1a24] text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium'
                      )}
                    >
                      <Bookmark
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          activeTab === 'deseados' ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-200'
                        )}
                      />
                      <span>Deseados</span>
                      {ownerFavWines.length > 0 && (
                        <span
                          className={cn(
                            'text-xs font-mono px-1.5 py-0.5 rounded-sm',
                            activeTab === 'deseados' ? 'bg-black/25 text-rose-100' : 'bg-[#0f0e13] text-zinc-400'
                          )}
                        >
                          {ownerFavWines.length}
                        </span>
                      )}
                    </button>

                    {/* 4. Bodegas que sigo */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('bodegas')}
                      className={cn(
                        'group px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-sans flex items-center gap-2 transition-all whitespace-nowrap',
                        activeTab === 'bodegas'
                          ? 'bg-[#6e1a24] text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium'
                      )}
                    >
                      <Building2
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          activeTab === 'bodegas' ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-200'
                        )}
                      />
                      <span>Bodegas</span>
                      {profile.followingCount > 0 && (
                        <span
                          className={cn(
                            'text-xs font-mono px-1.5 py-0.5 rounded-sm',
                            activeTab === 'bodegas' ? 'bg-black/25 text-rose-100' : 'bg-[#0f0e13] text-zinc-400'
                          )}
                        >
                          {profile.followingCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Contenido de la pestaña activa */}
                  {ownerDataLoading ? (
                    <div className="flex items-center justify-center py-28">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                    </div>
                  ) : activeTab === 'cava' ? (
                    /* PESTAÑA CAVA (INTACTA) */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                            Colección & Joyas de la Cava
                          </h2>
                          <p className="text-sm text-zinc-300 font-sans mt-0.5">
                            Las etiquetas más destacadas de tu colección personal.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#17151a] border border-white/15 hover:border-white/25 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-rose-400" />
                            <span>Explorar Catálogo</span>
                          </Link>
                          <Link
                            to="/cava"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-rose-950/70 border border-rose-800/50 hover:bg-rose-900/70 text-xs font-sans font-medium text-rose-100 transition-colors"
                          >
                            <span>Ir a Cava Completa</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                      {ownerCellarItems.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                          <Link
                            to="/catalogo"
                            className="group border-2 border-dashed border-rose-500/30 hover:border-rose-400/70 bg-[#17151a]/40 hover:bg-[#17151a]/70 rounded-md p-6 flex flex-col items-center justify-center text-center transition-all min-h-[260px] shadow-sm"
                          >
                            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-900/80 transition-all mb-4">
                              <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="font-serif text-lg font-medium text-white mb-1 group-hover:text-rose-300 transition-colors">
                              Sumá tu primera joya
                            </h3>
                            <p className="text-xs text-zinc-300 font-sans max-w-[200px] leading-relaxed">
                              Explorá el catálogo de vinos y añadí tus botellas para comenzar tu cava personal.
                            </p>
                          </Link>

                          {[1, 2, 3].map((slotIndex) => (
                            <Link
                              key={slotIndex}
                              to="/catalogo"
                              className="hidden sm:flex group border-2 border-dashed border-zinc-800/60 bg-[#17151a]/10 rounded-md p-6 flex-col items-center justify-center text-center opacity-40 hover:opacity-75 transition-opacity min-h-[260px]"
                            >
                              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-zinc-800/60 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 transition-colors mb-3">
                                <Plus className="w-4 h-4" />
                              </div>
                              <p className="text-xs text-zinc-600 font-sans">
                                Espacio disponible para etiqueta
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {ownerShowcaseWines.map((item) => (
                              <article
                                key={item.wineVintageId}
                                className="group bg-[#17151a] border border-white/10 hover:border-rose-900/40 rounded-md p-4 flex flex-col justify-between transition-all hover:bg-[#1c1920] hover:-translate-y-0.5"
                              >
                                <div className="w-full h-44 bg-[#0f0e13] rounded-sm border border-white/5 flex items-center justify-center p-3 mb-3 relative overflow-hidden group-hover:bg-[#121118] transition-colors">
                                  <ShowcaseWineBottle src={item.imageId ? imageUrl(item.imageId, 'bottle') : item.imageUrl} alt={item.name} />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
                                    <span className="truncate">{item.wineType}</span>
                                    <span>{item.year || 'S/A'}</span>
                                  </div>
                                  <h3 className="text-base font-bold text-white truncate group-hover:text-rose-400 transition-colors font-sans">
                                    {item.name}
                                  </h3>
                                  <p className="text-sm text-zinc-300 truncate font-sans">
                                    {item.wineryNameText || 'Bodega'}
                                  </p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-sans">
                                  {item.averageRating ? (
                                    <span className="flex items-center gap-1 text-amber-400 font-bold font-mono text-sm">
                                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                                      {item.averageRating}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-xs font-sans">Sin puntaje</span>
                                  )}
                                  <span className="text-rose-300 text-xs font-medium font-sans">
                                    {item.quantity} {item.quantity === 1 ? 'botella' : 'botellas'}
                                  </span>
                                </div>
                              </article>
                            ))}

                            {ownerShowcaseWines.length < 4 && (
                              <Link
                                to="/catalogo"
                                className="group border-2 border-dashed border-rose-500/25 hover:border-rose-400/60 bg-[#17151a]/30 hover:bg-[#17151a]/60 rounded-md p-6 flex flex-col items-center justify-center text-center transition-all min-h-[220px]"
                              >
                                <div className="w-10 h-10 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-400 group-hover:scale-110 group-hover:bg-rose-900/60 transition-all flex items-center justify-center mb-3">
                                  <Plus className="w-5 h-5" />
                                </div>
                                <span className="font-serif text-sm font-medium text-white group-hover:text-rose-300 transition-colors">
                                  Agregar otra joya
                                </span>
                                <span className="text-xs text-zinc-400 font-sans mt-0.5">
                                  Explorar catálogo
                                </span>
                              </Link>
                            )}
                          </div>

                          <div className="pt-4 flex justify-center">
                            <Link
                              to="/cava"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#17151a] hover:bg-[#221f26] border border-white/15 hover:border-white/25 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors shadow-sm"
                            >
                              <span>Ver Cava Completa ({profile.cellarWinesCount} botellas)</span>
                              <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  ) : activeTab === 'historial' ? (
                    /* PESTAÑA HISTORIAL (GET /api/users/me/history) */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                            Historial de Actividad
                          </h2>
                          <p className="text-sm text-zinc-300 font-sans mt-0.5">
                            Registro cronológico de tus descorches, reseñas, botellas guardadas y vinos cargados.
                          </p>
                        </div>

                        {/* Filtros por tipo de actividad con estilo de chips */}
                        <div role="group" aria-label="Filtro de actividades" className="flex flex-wrap items-center gap-2">
                          {HISTORY_FILTER_CHIPS.map((chip) => {
                            const isSelected = historyTypeFilter === chip.value;
                            return (
                              <button
                                key={chip.label}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setHistoryTypeFilter(chip.value)}
                                className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-rose-950/40 border border-rose-700/60 text-rose-200 shadow-sm'
                                    : 'bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                                }`}
                              >
                                {chip.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {historyItems.length === 0 ? (
                        <div className="border border-white/10 bg-[#17151a] rounded-md p-14 text-center space-y-3">
                          <History className="w-8 h-8 text-neutral-500 mx-auto" />
                          <h3 className="font-serif text-lg font-medium text-white">Sin actividad registrada</h3>
                          <p className="text-sm text-zinc-300 font-sans max-w-sm mx-auto">
                            {historyTypeFilter
                              ? 'No hay actividades para el filtro seleccionado.'
                              : 'Aún no registraste actividades en tu historial.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {historyItems.map((item) => {
                              const meta = ACTIVITY_TYPE_META[item.type] || {
                                label: item.type,
                                badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
                              };

                              // Prioridad de imagen: personal -> pública de cosecha -> silueta
                              const imageSrc = item.personalImageId
                                ? imageUrl(item.personalImageId, 'bottle')
                                : item.vintage?.imageId
                                ? imageUrl(item.vintage.imageId, 'bottle')
                                : null;

                              return (
                                <Link
                                  key={item.id}
                                  to={`/vinos/${item.wine.id}`}
                                  className="group p-4 rounded-md bg-[#17151a] border border-white/10 space-y-3 flex flex-col justify-between hover:border-rose-900/40 hover:bg-[#1c1920] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
                                >
                                  <div>
                                    {/* Cabecera de tarjeta: Tipo de vino y Rótulo de acción */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <span className="text-xs font-mono font-medium uppercase tracking-wide text-zinc-300">
                                        {item.wine.wineType}
                                      </span>
                                      <span
                                        className={cn(
                                          'px-2 py-0.5 rounded-sm text-xs font-mono border',
                                          meta.badgeClass
                                        )}
                                      >
                                        {meta.label}
                                      </span>
                                    </div>

                                    {/* Imagen de Botella */}
                                    <div className="w-full h-36 bg-[#0f0e13] rounded-sm border border-white/5 flex items-center justify-center p-2 mb-3 relative overflow-hidden group-hover:bg-[#121118] transition-colors">
                                      <ShowcaseWineBottle src={imageSrc} alt={item.wine.name} />
                                    </div>

                                    {/* Nombre, Bodega y Año de Cosecha */}
                                    <h3 className="text-base font-bold text-white truncate font-sans group-hover:text-rose-400 transition-colors">
                                      {item.wine.name}
                                    </h3>
                                    <p className="text-sm text-zinc-300 truncate font-sans">
                                      {item.wine.wineryName || 'Bodega'} <span className="text-zinc-500">·</span>{' '}
                                      {item.vintage?.year ? item.vintage.year : 'Sin añada'}
                                    </p>

                                    {/* Puntaje propio (estrellas) y comentario opcional */}
                                    {item.rating && (
                                      <div className="mt-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1 text-amber-400">
                                          {Array.from({ length: item.rating }).map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                          ))}
                                          <span className="font-mono text-xs font-bold text-neutral-200 ml-1">
                                            {item.rating}/5
                                          </span>
                                        </div>
                                        {item.comment && (
                                          <p className="text-xs text-zinc-400 italic line-clamp-2 mt-1 font-sans">
                                            &ldquo;{item.comment}&rdquo;
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Pie de tarjeta: Fecha del evento */}
                                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-sans text-zinc-400">
                                    <span>{new Date(item.occurredAt).toLocaleDateString('es-AR')}</span>
                                    <span className="text-rose-400/90 group-hover:text-rose-300 text-xs font-medium">
                                      Ver ficha &rarr;
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>

                          {/* Botón Cargar Más Historial */}
                          {hasMoreHistory && (
                            <div className="text-center pt-2">
                              <button
                                type="button"
                                onClick={handleLoadMoreHistory}
                                disabled={historyLoadingMore}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#141417] border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                              >
                                {historyLoadingMore ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                                    <span>Cargando más...</span>
                                  </>
                                ) : (
                                  <span>Cargar más</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'deseados' ? (
                    /* PESTAÑA DESEADOS (SIN averageRating) */
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                          Deseados y Favoritos
                        </h2>
                        <p className="text-sm text-zinc-300 font-sans mt-0.5">
                          Etiquetas que guardaste para probar o adquirir en el futuro.
                        </p>
                      </div>

                      {ownerFavWines.length === 0 ? (
                        <div className="border border-white/10 bg-[#17151a] rounded-md p-14 text-center space-y-3">
                          <Bookmark className="w-8 h-8 text-neutral-500 mx-auto" />
                          <h3 className="font-serif text-lg font-medium text-white">Sin deseados o favoritos</h3>
                          <p className="text-sm text-zinc-300 font-sans max-w-sm mx-auto">
                            No tenés vinos en tu lista de deseos o favoritos.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                          {ownerFavWines.map((wine) => (
                            <Link
                              key={wine.wineId}
                              to={`/vinos/${wine.wineId}`}
                              className="group p-4 rounded-md bg-[#17151a] border border-white/10 space-y-3 flex flex-col justify-between hover:border-rose-900/40 hover:bg-[#1c1920] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-xs font-mono font-medium uppercase tracking-wide text-zinc-300">
                                    {wine.wineType}
                                  </span>
                                  <div className="flex gap-1.5">
                                    {wine.isFavorite && (
                                      <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-rose-950/60 text-rose-300 border border-rose-800/40">
                                        Favorito
                                      </span>
                                    )}
                                    {wine.isWanted && (
                                      <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                                        Deseado
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <h3 className="text-base font-bold text-white truncate font-sans group-hover:text-rose-400 transition-colors">
                                  {wine.name}
                                </h3>
                                <p className="text-sm text-zinc-300 truncate font-sans">
                                  {wine.wineryNameText || 'Bodega'}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-sans text-zinc-400">
                                <span>{new Date(wine.lastChangeAt).toLocaleDateString('es-AR')}</span>
                                <span className="text-rose-400/90 group-hover:text-rose-300 text-xs font-medium">
                                  Ver ficha &rarr;
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* PESTAÑA BODEGAS QUE SIGO (GET /api/users/me/following-wineries) */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                            Bodegas que sigo
                          </h2>
                          <p className="text-sm text-zinc-300 font-sans mt-0.5">
                            Seguí las novedades, nuevas cosechas y lanzamientos de tus bodegas favoritas.
                          </p>
                        </div>
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#17151a] border border-white/15 hover:border-white/25 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5 text-rose-400" />
                          <span>Descubrir Bodegas</span>
                        </Link>
                      </div>

                      {/* Error al cargar bodegas */}
                      {wineriesError && (
                        <div className="p-6 rounded-md bg-rose-950/20 border border-rose-900/50 text-center space-y-3">
                          <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                          <p className="text-sm text-neutral-200">{wineriesError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('cava');
                              setTimeout(() => setActiveTab('bodegas'), 10);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-rose-900/60 border border-rose-700/60 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-900 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reintentar</span>
                          </button>
                        </div>
                      )}

                      {!wineriesError && followingWineries.length === 0 ? (
                        <div className="border border-white/10 bg-[#17151a] rounded-md p-14 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                            <Building2 className="w-6 h-6 text-rose-400/80" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif text-xl font-medium text-white">
                              Todavía no seguís ninguna bodega
                            </h3>
                            <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                              Explorá el catálogo de productores para descubrir terruños y recibir actualizaciones de añadas.
                            </p>
                          </div>
                          <div className="pt-2">
                            <Link
                              to="/catalogo"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#221f26] hover:bg-[#2a2630] border border-white/15 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors"
                            >
                              <span>Explorar catálogo de vinos</span>
                            </Link>
                          </div>
                        </div>
                      ) : !wineriesError && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {followingWineries.map((winery) => {
                              const locationStr = [winery.regionName, winery.stateName]
                                .filter(Boolean)
                                .join(', ');

                              return (
                                <article
                                  key={winery.wineryId}
                                  className="group p-4 rounded-md bg-[#17151a] border border-white/10 space-y-3 flex flex-col justify-between hover:border-rose-900/40 hover:bg-[#1c1920] transition-all shadow-sm"
                                >
                                  <div>
                                    {/* Cabecera: Logo y Datos principales */}
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="w-12 h-12 rounded-full bg-[#0f0e13] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {winery.logoImageId ? (
                                          <img
                                            src={imageUrl(winery.logoImageId, 'logo') || undefined}
                                            alt={winery.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="font-serif font-bold text-rose-400 text-lg">
                                            {winery.name.charAt(0)}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <Link
                                          to={`/bodegas/${winery.wineryId}`}
                                          className="text-base font-bold text-white hover:text-rose-400 transition-colors truncate block font-sans"
                                        >
                                          {winery.name}
                                        </Link>
                                        {locationStr && (
                                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 truncate font-sans">
                                            <MapPin className="w-3 h-3 text-rose-400/80 shrink-0" />
                                            <span>{locationStr}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Métricas: Cantidad de vinos y Seguidores */}
                                    <div className="flex items-center gap-3 text-xs font-sans text-zinc-300 py-2 border-y border-white/5">
                                      <span>
                                        {winery.labelsCount} {winery.labelsCount === 1 ? 'vino' : 'vinos'}
                                      </span>
                                      <span className="text-zinc-600">·</span>
                                      <span>
                                        {winery.followersCount} {winery.followersCount === 1 ? 'seguidor' : 'seguidores'}
                                      </span>
                                    </div>

                                    {/* Siguiendo desde */}
                                    <p className="text-xs text-zinc-400 font-sans pt-1">
                                      Siguiendo desde{' '}
                                      {new Date(winery.followedAt).toLocaleDateString('es-AR', {
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  </div>

                                  {/* Acción: Dejar de seguir */}
                                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                    <Link
                                      to={`/bodegas/${winery.wineryId}`}
                                      className="text-xs text-zinc-300 hover:text-white font-medium transition-colors"
                                    >
                                      Ver bodega &rarr;
                                    </Link>
                                    <button
                                      type="button"
                                      disabled={unfollowingId === winery.wineryId}
                                      onClick={() => setUnfollowTarget(winery)}
                                      className="px-2.5 py-1 rounded-sm border border-white/10 hover:border-rose-700/60 hover:bg-rose-950/30 text-xs font-sans text-zinc-400 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {unfollowingId === winery.wineryId ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                                      ) : (
                                        'Dejar de seguir'
                                      )}
                                    </button>
                                  </div>
                                </article>
                              );
                            })}
                          </div>

                          {/* Botón Cargar Más Bodegas */}
                          {hasMoreWineries && (
                            <div className="text-center pt-2">
                              <button
                                type="button"
                                onClick={handleLoadMoreWineries}
                                disabled={wineriesLoadingMore}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#141417] border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                              >
                                {wineriesLoadingMore ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                                    <span>Cargando más...</span>
                                  </>
                                ) : (
                                  <span>Cargar más</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* VISTA VISITANTE (INTACTA) */
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/15">
                    <div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Colección & Joyas de la Cava
                      </h2>
                      <p className="text-sm text-zinc-300 font-sans mt-0.5">
                        Selección destacada de etiquetas en la colección de {profile.username}.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-medium text-zinc-300">
                      {profile.cellarWinesCount} {profile.cellarWinesCount === 1 ? 'botella' : 'botellas'}
                    </span>
                  </div>

                  {publicWinesLoading ? (
                    <div className="flex items-center justify-center py-28">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                    </div>
                  ) : publicWines.length === 0 ? (
                    <div className="border border-white/10 bg-[#17151a] rounded-md p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                        <Wine className="w-6 h-6 text-rose-400/80" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-medium text-white">Cava en curación</h3>
                        <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                          Este sommelier aún no ha destacado botellas en su cava pública.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#221f26] hover:bg-[#2a2630] border border-white/15 text-xs font-sans font-medium text-zinc-200 hover:text-white transition-colors"
                        >
                          <span>Explorar catálogo de vinos</span>
                        </Link>
                        {!isAuthenticated && (
                          <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#6e1a24] hover:bg-[#831823] text-white border border-rose-700/50 text-xs font-sans font-medium transition-colors shadow-sm"
                          >
                            <span>Crear mi propia cava</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {publicShowcaseWines.map((wine) => (
                        <article
                          key={wine.wineVintageId}
                          className="group bg-[#17151a] border border-white/10 hover:border-rose-900/40 rounded-md p-4 flex flex-col justify-between transition-all hover:bg-[#1c1920] hover:-translate-y-0.5"
                        >
                          <div className="w-full h-44 bg-[#0f0e13] rounded-sm border border-white/5 flex items-center justify-center p-3 mb-3 relative overflow-hidden group-hover:bg-[#121118] transition-colors">
                            <ShowcaseWineBottle src={wine.imageId ? imageUrl(wine.imageId, 'bottle') : wine.imageUrl} alt={wine.name} />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
                              <span className="truncate">{wine.wineType}</span>
                              <span>{wine.year || 'S/A'}</span>
                            </div>
                            <h3 className="text-base font-bold text-white truncate group-hover:text-rose-400 transition-colors font-sans">
                              {wine.name}
                            </h3>
                            <p className="text-sm text-zinc-300 truncate font-sans">
                              {wine.wineryNameText || 'Bodega'}
                            </p>
                          </div>

                          {wine.averageRating && (
                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-sans text-zinc-300">
                              <div className="flex items-center gap-1 text-amber-400 font-bold font-mono text-sm">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{wine.averageRating}</span>
                              </div>
                              <span className="text-xs text-zinc-400 font-sans">{wine.reviewCount} reseñas</span>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Cuadro de Diálogo de Confirmación para Dejar de Seguir Bodega */}
      <ConfirmDialog
        open={Boolean(unfollowTarget)}
        title="¿Dejar de seguir bodega?"
        message={
          unfollowTarget
            ? `¿Estás seguro de que querés dejar de seguir a "${unfollowTarget.name}"? Dejarás de recibir sus novedades en tu feed.`
            : ''
        }
        confirmLabel="Dejar de seguir"
        tone="danger"
        onConfirm={handleConfirmUnfollowWinery}
        onCancel={() => setUnfollowTarget(null)}
      />

      {/* Toast Flotante Contextual */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={cn(
              'px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 max-w-sm text-sm',
              toastMessage.isError
                ? 'bg-rose-950/95 border-rose-800 text-rose-200'
                : 'bg-[#17151a]/95 border-white/20 text-white'
            )}
          >
            {toastMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Wine className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="leading-snug">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
