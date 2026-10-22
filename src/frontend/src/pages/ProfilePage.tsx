import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  Wine,
  History,
  Bookmark,
  UserPlus,
  UserCheck,
  Star,
  Sparkles,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import { DashboardNavbar } from '../features/dashboard';
import Navbar from '../components/layout/Navbar';
import { getAvatarUrl } from '../lib/avatar';
import {
  getPublicUserProfileApi,
  getPublicCellarItemsApi,
  followUserApi,
  unfollowUserApi,
  getMyFollowingUsersApi,
  getMyCellarsApi,
  getCellarItemsApi,
  getMyUserWinesApi,
  type PublicUserProfileDto,
  type PublicCellarItemDto,
  type CellarItemDto,
  type UserWineListItemDto,
} from '../features/users';
import { cn } from '../lib/utils';
import WineBottleSilhouette from '../features/wines/components/WineBottleSilhouette';

type OwnerTab = 'cava' | 'historial' | 'deseados';

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
  const [ownerTriedWines, setOwnerTriedWines] = useState<UserWineListItemDto[]>([]);
  const [ownerFavWines, setOwnerFavWines] = useState<UserWineListItemDto[]>([]);
  const [ownerDataLoading, setOwnerDataLoading] = useState(false);

  const isOwner = Boolean(
    currentUser &&
    username &&
    currentUser.username?.toLowerCase() === username.toLowerCase()
  );

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
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? ((err as { response?: { status?: number } }).response?.status === 404
                ? 'El usuario solicitado no existe o no se encuentra disponible.'
                : 'Ocurrió un error al cargar el perfil.')
            : 'No se pudo conectar con el servidor.';
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
  useEffect(() => {
    if (!profile || isOwner) return;

    let isMounted = true;
    async function loadPublicWines() {
      setPublicWinesLoading(true);
      try {
        const wines = await getPublicCellarItemsApi(profile!.username);
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
  }, [profile, isOwner]);

  // Cargar datos del owner según pestaña activa
  useEffect(() => {
    if (!isOwner || !profile) return;

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
          const tried = await getMyUserWinesApi({ tried: true });
          if (isMounted) setOwnerTriedWines(tried);
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
        }
      } catch {
        // En caso de fallo de red, mantener estados previos
      } finally {
        if (isMounted) setOwnerDataLoading(false);
      }
    }

    void loadOwnerData();
    return () => {
      isMounted = false;
    };
  }, [isOwner, profile, activeTab]);

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
    } catch {
      // Manejar error sutilmente
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-200 font-sans flex flex-col justify-between selection:bg-rose-900 selection:text-white">
      {/* 1. Navbar adaptativo */}
      {isAuthenticated ? <DashboardNavbar /> : <Navbar />}

      {/* 2. Contenido del Perfil */}
      <main className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8 pb-20 pt-28 sm:pt-32 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
            <p className="text-sm text-neutral-400 font-mono tracking-wider">Cargando perfil...</p>
          </div>
        ) : error || !profile ? (
          <div className="flex flex-col items-center justify-center py-28 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-800/40 flex items-center justify-center mb-5 text-rose-400">
              <Wine className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-100 mb-2">Perfil no encontrado</h2>
            <p className="text-sm text-neutral-400 mb-6">{error || 'El usuario especificado no existe.'}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-sm font-medium text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header del Perfil */}
            <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#141418] to-[#101013] p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                {/* Foto / Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/10 bg-neutral-900 shadow-2xl">
                    <img
                      src={getAvatarUrl({ photo: profile.photo, username: profile.username })}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                          profile.username
                        )}&backgroundColor=1c1917,292524`;
                      }}
                    />
                  </div>
                </div>

                {/* Datos del Usuario */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                          {profile.username}
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 border border-rose-800/40 px-2.5 py-0.5 text-[10px] font-mono font-medium text-rose-300">
                          <Sparkles className="w-2.5 h-2.5" />
                          Sommelier
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">
                        Miembro desde {new Date(profile.registerDate).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Acciones principales: Rueda si es dueño, Botón Seguir si es visitante */}
                    <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 sm:pt-0">
                      {isOwner ? (
                        <Link
                          to="/cuenta"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-medium text-neutral-200 transition-all hover:text-white hover:border-white/20 shadow-sm"
                          title="Configuración de Cuenta"
                        >
                          <Settings className="w-4 h-4 text-neutral-400" />
                          <span>Configuración</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleToggleFollow()}
                          disabled={followLoading}
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98]',
                            isFollowing
                              ? 'bg-neutral-800/80 hover:bg-rose-950/60 hover:text-rose-300 border border-white/10 text-neutral-200'
                              : 'bg-[#6e1a24] hover:bg-[#831823] text-white border border-rose-700/50 shadow-md shadow-rose-950/30'
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
                    </div>
                  </div>

                  {/* Biografía */}
                  <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                    {profile.bio && profile.bio.trim().length > 0 ? (
                      profile.bio
                    ) : (
                      <span className="italic text-neutral-500">Sin biografía disponible aún.</span>
                    )}
                  </p>

                  {/* Estadísticas de Perfil */}
                  <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 border-t border-white/5 text-xs font-medium">
                    <div>
                      <span className="text-base font-bold text-white font-mono mr-1.5">
                        {profile.cellarWinesCount}
                      </span>
                      <span className="text-neutral-400">Vinos en cava</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-neutral-700" />
                    <div>
                      <span className="text-base font-bold text-white font-mono mr-1.5">
                        {profile.followersCount}
                      </span>
                      <span className="text-neutral-400">Seguidores</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-neutral-700" />
                    <div>
                      <span className="text-base font-bold text-white font-mono mr-1.5">
                        {profile.followingCount}
                      </span>
                      <span className="text-neutral-400">Siguiendo</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN BODY */}
            {isOwner ? (
              /* VISTA PROPIA: Con columna lateral y pestañas de gestión */
              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
                {/* Columna Lateral (Sidebar) */}
                <aside className="bg-[#121215] border border-white/5 rounded-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('cava')}
                    className={cn(
                      'flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left',
                      activeTab === 'cava'
                        ? 'bg-rose-950/60 text-white border border-rose-800/40'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wine className="w-4 h-4 text-rose-400" />
                      <span>Mi Cava</span>
                    </div>
                    <span className="font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded-full text-neutral-300">
                      {profile.cellarWinesCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('historial')}
                    className={cn(
                      'flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left',
                      activeTab === 'historial'
                        ? 'bg-rose-950/60 text-white border border-rose-800/40'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Historial</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('deseados')}
                    className={cn(
                      'flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left',
                      activeTab === 'deseados'
                        ? 'bg-rose-950/60 text-white border border-rose-800/40'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-emerald-400" />
                      <span>Deseados / Favoritos</span>
                    </div>
                  </button>
                </aside>

                {/* Panel Central de la Pestaña Activa */}
                <section className="bg-[#121215] border border-white/5 rounded-2xl p-6 min-h-[350px]">
                  {ownerDataLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                    </div>
                  ) : activeTab === 'cava' ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div>
                          <h2 className="text-base font-semibold text-white">Vinos en mi Cava</h2>
                          <p className="text-xs text-neutral-400">Botellas registradas en tu cava personal.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Explorar</span>
                          </Link>
                          <Link
                            to="/cava"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900/60 text-xs text-rose-200 transition-colors"
                          >
                            <span>Ir a Cava completa</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {ownerCellarItems.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                          <Wine className="w-10 h-10 text-neutral-600 mx-auto" />
                          <p className="text-xs text-neutral-400">Aún no agregaste botellas a tu cava.</p>
                          <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
                          >
                            Explorar catálogo
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ownerCellarItems.map((item) => (
                            <div
                              key={item.wineVintageId}
                              className="flex items-center gap-4 p-3.5 rounded-xl bg-[#16161a] border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className="w-14 h-18 bg-[#0e0e11] rounded-lg border border-white/5 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="max-h-full w-auto object-contain"
                                  />
                                ) : (
                                  <WineBottleSilhouette className="w-6 h-12 text-neutral-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-semibold text-white truncate">{item.name}</h3>
                                <p className="text-[11px] text-neutral-400 truncate">
                                  {item.wineryNameText || 'Bodega'} · {item.year || 'S/A'}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                                  <span className="font-mono text-rose-300 font-semibold">
                                    {item.quantity} {item.quantity === 1 ? 'botella' : 'botellas'}
                                  </span>
                                  {item.averageRating && (
                                    <span className="flex items-center gap-0.5 text-amber-400">
                                      <Star className="w-3 h-3 fill-amber-400" />
                                      {item.averageRating}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'historial' ? (
                    <div className="space-y-5">
                      <div className="pb-4 border-b border-white/5">
                        <h2 className="text-base font-semibold text-white">Historial de Catas</h2>
                        <p className="text-xs text-neutral-400">Vinos que marcaste como probados y descorchados.</p>
                      </div>

                      {ownerTriedWines.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                          <History className="w-10 h-10 text-neutral-600 mx-auto" />
                          <p className="text-xs text-neutral-400">Aún no registraste vinos probados en tu historial.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ownerTriedWines.map((wine) => (
                            <div
                              key={wine.wineId}
                              className="p-3.5 rounded-xl bg-[#16161a] border border-white/5 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-xs font-semibold text-white truncate">{wine.name}</h3>
                                  <p className="text-[11px] text-neutral-400">{wine.wineryNameText || 'Bodega'}</p>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-800/40">
                                  Probado
                                </span>
                              </div>
                              {wine.averageRating && (
                                <div className="flex items-center gap-1 text-[11px] text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{wine.averageRating} ({wine.reviewCount} reseñas)</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="pb-4 border-b border-white/5">
                        <h2 className="text-base font-semibold text-white">Deseados y Favoritos</h2>
                        <p className="text-xs text-neutral-400">Etiquetas que guardaste para probar o comprar.</p>
                      </div>

                      {ownerFavWines.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                          <Bookmark className="w-10 h-10 text-neutral-600 mx-auto" />
                          <p className="text-xs text-neutral-400">No tienes vinos en tu lista de deseos o favoritos.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ownerFavWines.map((wine) => (
                            <div
                              key={wine.wineId}
                              className="p-3.5 rounded-xl bg-[#16161a] border border-white/5 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-xs font-semibold text-white truncate">{wine.name}</h3>
                                  <p className="text-[11px] text-neutral-400">{wine.wineryNameText || 'Bodega'}</p>
                                </div>
                                <div className="flex gap-1">
                                  {wine.isFavorite && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/40">
                                      Favorito
                                    </span>
                                  )}
                                  {wine.isWanted && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                                      Deseado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* VISTA VISITANTE: Sin columna lateral, diseño de presentación sobrio con grilla pública */
              <section className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <h2 className="text-lg font-bold text-white">Cava Pública de {profile.username}</h2>
                    <p className="text-xs text-neutral-400">
                      Colección de etiquetas visibles en la cava comunitaria.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-neutral-400">
                    {publicWines.length} {publicWines.length === 1 ? 'etiqueta' : 'etiquetas'}
                  </span>
                </div>

                {publicWinesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                  </div>
                ) : publicWines.length === 0 ? (
                  <div className="bg-[#121215] border border-white/5 rounded-2xl p-12 text-center space-y-3">
                    <Wine className="w-10 h-10 text-neutral-600 mx-auto" />
                    <p className="text-sm text-neutral-400">Este usuario aún no tiene vinos en su cava pública.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {publicWines.map((wine) => (
                      <article
                        key={wine.wineVintageId}
                        className="bg-[#121215] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-xl group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-22 bg-[#0c0c0e] rounded-xl border border-white/5 flex items-center justify-center shrink-0 overflow-hidden p-1.5 group-hover:bg-[#101013] transition-colors">
                            {wine.imageUrl ? (
                              <img
                                src={wine.imageUrl}
                                alt={wine.name}
                                className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <WineBottleSilhouette className="w-7 h-14 text-neutral-500 transition-transform duration-300 group-hover:scale-105" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                              {wine.wineType} · {wine.year || 'S/A'}
                            </span>
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                              {wine.name}
                            </h3>
                            <p className="text-xs text-neutral-400 truncate">
                              {wine.wineryNameText || 'Bodega'}
                            </p>
                          </div>
                        </div>

                        {wine.averageRating && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span className="font-bold">{wine.averageRating}</span>
                            </div>
                            <span>{wine.reviewCount} reseñas</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

