import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  Wine,
  History,
  Bookmark,
  UserPlus,
  UserCheck,
  Star,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import ProfileTopBar from '../components/layout/ProfileTopBar';
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
    } catch {
      // Manejar error sutilmente
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-neutral-100 font-sans flex flex-col justify-between selection:bg-rose-900 selection:text-white">
      {/* 1. Top Bar Contextual Slim (reemplaza al Navbar global) */}
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
            {/* BANNER COMPACTO CON GRADIENTE BORGOÑA */}
            <div className="relative w-full h-36 sm:h-40 bg-gradient-to-b from-[#3a0d18] via-[#1c070c] to-[#0b0b0e] border-b border-rose-950/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-900/25 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* CABECERA EXPANSIVA DE PERFIL CON AVATAR CIRCULAR SUPERPUESTO */}
            <header className="w-full bg-[#0b0b0e] border-b border-white/10 pb-8">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  {/* Bloque Izquierdo: Avatar Circular superpuesto + Nombre Serif + Bio */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                    {/* Avatar Circular con aro aislante que pisa el banner */}
                    <div className="relative z-10 -mt-12 sm:-mt-14 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-[#0b0b0e] shadow-2xl border border-white/15 bg-[#17151a] shrink-0">
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

                    {/* Identidad y Metadatos */}
                    <div className="space-y-2 max-w-2xl">
                      <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                        {profile.username}
                      </h1>

                      <p className="text-xs sm:text-sm font-sans font-medium text-zinc-300">
                        Miembro desde{' '}
                        {new Date(profile.registerDate).toLocaleDateString('es-AR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>

                      <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-sans">
                        {profile.bio && profile.bio.trim().length > 0 ? (
                          profile.bio
                        ) : (
                          <span className="italic text-zinc-400 text-sm">Sin biografía disponible aún.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Bloque Derecho: Acciones Contextuales y Métricas Consolidadas con espaciado respirable */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-end gap-3.5 pt-4 sm:pt-6 md:pt-8">
                    {/* Botón Acción (Configuración para dueño / Seguir para visitante) */}
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

                    {/* Métricas Numéricas Reales en Card Sobria */}
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
                /* VISTA PROPIETARIO: Pestañas Segmentadas en Cápsula Flotante */
                <div className="space-y-8">
                  {/* Barra de Pestañas Segmentadas */}
                  <div className="inline-flex p-1 bg-[#17151a] border border-white/10 rounded-md gap-1 overflow-x-auto max-w-full">
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
                      <span>Historial de Catas</span>
                    </button>

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
                      <span>Deseados & Favoritos</span>
                    </button>
                  </div>

                  {/* Contenido de la pestaña activa */}
                  {ownerDataLoading ? (
                    <div className="flex items-center justify-center py-28">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                    </div>
                  ) : activeTab === 'cava' ? (
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
                            to="/dashboard#catalogo"
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

                      {/* Empty State / Grilla para el Dueño con slots interactivos punteados */}
                      {ownerCellarItems.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                          {/* Slot Principal Interactivo (+) */}
                          <Link
                            to="/dashboard#catalogo"
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

                          {/* Placeholders secundarios atenuados */}
                          {[1, 2, 3].map((slotIndex) => (
                            <Link
                              key={slotIndex}
                              to="/dashboard#catalogo"
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
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <WineBottleSilhouette className="w-8 h-20 text-neutral-500 transition-transform duration-300 group-hover:scale-105" />
                                  )}
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

                            {/* Slot punteado interactivo adicional si hay pocas botellas */}
                            {ownerShowcaseWines.length < 4 && (
                              <Link
                                to="/dashboard#catalogo"
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

                          {/* CTA Ver Cava Completa */}
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
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
                          Historial de Catas
                        </h2>
                        <p className="text-sm text-zinc-300 font-sans mt-0.5">
                          Vinos que registraste como probados y descorchados.
                        </p>
                      </div>

                      {ownerTriedWines.length === 0 ? (
                        <div className="border border-white/10 bg-[#17151a] rounded-md p-14 text-center space-y-3">
                          <History className="w-8 h-8 text-neutral-500 mx-auto" />
                          <h3 className="font-serif text-lg font-medium text-white">Sin historial registrado</h3>
                          <p className="text-sm text-zinc-300 font-sans max-w-sm mx-auto">
                            Aún no registraste vinos probados en tu historial.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                          {ownerTriedWines.map((wine) => (
                            <div
                              key={wine.wineId}
                              className="p-4 rounded-md bg-[#17151a] border border-white/10 space-y-2 flex flex-col justify-between hover:border-rose-900/30 transition-all"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-xs font-mono font-medium uppercase tracking-wide text-zinc-300">
                                    {wine.wineType}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                    Probado
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-white truncate font-sans">{wine.name}</h3>
                                <p className="text-sm text-zinc-300 truncate font-sans">{wine.wineryNameText || 'Bodega'}</p>
                              </div>

                              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-sans text-zinc-300">
                                {wine.averageRating ? (
                                  <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-sm">
                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                    <span>{wine.averageRating}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400">Sin calificar</span>
                                )}
                                <span className="text-xs text-zinc-400">
                                  {new Date(wine.lastChangeAt).toLocaleDateString('es-AR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
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
                            No tienes vinos en tu lista de deseos o favoritos.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                          {ownerFavWines.map((wine) => (
                            <div
                              key={wine.wineId}
                              className="p-4 rounded-md bg-[#17151a] border border-white/10 space-y-2 flex flex-col justify-between hover:border-rose-900/30 transition-all"
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
                                <h3 className="text-base font-bold text-white truncate font-sans">{wine.name}</h3>
                                <p className="text-sm text-zinc-300 truncate font-sans">{wine.wineryNameText || 'Bodega'}</p>
                              </div>

                              {wine.averageRating && (
                                <div className="pt-2 border-t border-white/10 flex items-center gap-1 text-sm font-mono text-amber-400 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  <span>{wine.averageRating} ({wine.reviewCount} reseñas)</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* VISTA VISITANTE: Joyas de la Cava en Mosaico Sobrio */
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
                    /* Empty state sobrio para el visitante: NO slots punteados ni dropzones */
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
                          to="/dashboard#catalogo"
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
                            {wine.imageUrl ? (
                              <img
                                src={wine.imageUrl}
                                alt={wine.name}
                                className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <WineBottleSilhouette className="w-8 h-20 text-neutral-500 transition-transform duration-300 group-hover:scale-105" />
                            )}
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
    </div>
  );
}
