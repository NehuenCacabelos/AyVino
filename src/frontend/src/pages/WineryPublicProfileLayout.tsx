import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Globe,
  ExternalLink,
  Users,
  Star,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Building2,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from '../features/auth';
import {
  getWineryPublicProfile,
  followWinery,
  unfollowWinery,
  WineryBanner,
  WineryLogo,
  WineryPublicTopBar,
  type WineryPublicProfileResponseDto,
} from '../features/winery';
import { cn } from '../lib/utils';

export interface WineryPublicOutletContext {
  profile: WineryPublicProfileResponseDto;
  locationLabel: string;
  reloadProfile: () => Promise<void>;
}

/**
 * WineryPublicProfileLayout Component
 * Layout inmersivo desacoplado para el perfil público de bodega (/bodegas/:id).
 * Carga el perfil una única vez y lo comparte con las subrutas mediante Outlet Context memoizado.
 */
export default function WineryPublicProfileLayout() {
  const { id } = useParams<{ id: string }>();
  const wineryId = Number(id);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<WineryPublicProfileResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Estado local para interacción optimista de seguimiento
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [isFollowingPending, setIsFollowingPending] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const loadProfile = useCallback(
    async (signal?: AbortSignal) => {
      if (isNaN(wineryId) || wineryId <= 0) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const data = await getWineryPublicProfile(wineryId, signal);
        setProfile(data);
        setIsFollowing(Boolean(data.isFollowedByMe));
        setFollowersCount(data.followersCount);
        setError(null);
        setIsNotFound(false);
      } catch (err: unknown) {
        if (signal?.aborted) return;

        if (isAxiosError(err)) {
          if (err.response?.status === 404) {
            setIsNotFound(true);
            return;
          }
          setError(
            (err.response?.data as { detail?: string })?.detail ||
              'No se pudo cargar la información de la bodega.',
          );
        } else {
          setError('Ocurrió un error inesperado al conectar con el servidor.');
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [wineryId],
  );

  useEffect(() => {
    const controller = new AbortController();

    Promise.resolve().then(() => {
      void loadProfile(controller.signal);
    });

    return () => {
      controller.abort();
    };
  }, [loadProfile]);

  const handleReload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    await loadProfile();
  }, [loadProfile]);

  // Handler de seguimiento con rollback optimista
  const handleToggleFollow = async () => {
    if (!profile) return;

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isFollowingPending) return;

    const previousFollow = isFollowing;
    const previousCount = followersCount;

    const nextFollow = !previousFollow;
    setIsFollowing(nextFollow);
    setFollowersCount((prev) => (nextFollow ? prev + 1 : Math.max(0, prev - 1)));
    setIsFollowingPending(true);

    try {
      if (nextFollow) {
        await followWinery(profile.id);
      } else {
        await unfollowWinery(profile.id);
      }
    } catch {
      // Rollback ante fallas
      setIsFollowing(previousFollow);
      setFollowersCount(previousCount);
    } finally {
      setIsFollowingPending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      const timer = window.setTimeout(() => setCopiedToast(false), 2000);
      return () => clearTimeout(timer);
    } catch {
      // Ignorar fallo de portapapeles
    }
  };

  // Etiqueta de ubicación derivada
  const locationLabel = useMemo(() => {
    if (!profile) return 'Argentina';
    const parts = [profile.location?.regionName, profile.location?.stateName].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Argentina';
  }, [profile]);

  // Contexto memoizado según regla permanente 11
  const contextValue = useMemo<WineryPublicOutletContext | null>(() => {
    if (!profile) return null;
    return {
      profile,
      locationLabel,
      reloadProfile: handleReload,
    };
  }, [profile, locationLabel, handleReload]);

  // =========================================================================
  // ESTADO 1: 404 AMABLE (BODEGA NO DISPONIBLE O INEXISTENTE)
  // =========================================================================
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] text-neutral-200 font-sans flex flex-col">
        <WineryPublicTopBar backLabel="Volver" />
        <main className="flex-1 flex items-center justify-center p-6 pt-20">
          <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-[#121015] border border-white/5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
              <Building2 className="w-7 h-7 text-rose-400/80" />
            </div>
            <h1 className="font-serif text-2xl font-medium text-white tracking-tight">
              Esta bodega todavía no está disponible
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Es posible que este establecimiento se encuentre en proceso de revisión o que el
              enlace sea incorrecto.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(user ? '/dashboard' : '/')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // ESTADO 2: CARGA CON ESQUELETOS
  // =========================================================================
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] text-neutral-200 font-sans flex flex-col">
        <WineryPublicTopBar />
        <div className="pt-14 flex-1 flex flex-col">
          <div className="w-full h-36 sm:h-44 md:h-52 bg-zinc-900/40 animate-pulse" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-zinc-900 border-4 border-[#0b0b0e] animate-pulse" />
              <div className="space-y-3 pt-4 sm:pt-6 flex-1">
                <div className="h-8 w-64 bg-zinc-900 rounded-lg animate-pulse" />
                <div className="h-4 w-40 bg-zinc-900/60 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ESTADO 3: ERROR GENÉRICO CON REINTENTO
  // =========================================================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] text-neutral-200 font-sans flex flex-col">
        <WineryPublicTopBar />
        <main className="flex-1 flex items-center justify-center p-6 pt-20">
          <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-[#121015] border border-white/5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-medium text-white tracking-tight">
              Ocurrió un inconveniente
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">{error}</p>
            <button
              type="button"
              onClick={() => void handleReload()}
              className="px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-mono uppercase tracking-wider text-white transition-colors cursor-pointer shadow-lg"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL CON CABECERA INMERSIVA Y OUTLET
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0b0b0e] text-neutral-200 font-sans selection:bg-[#6e1a24] selection:text-white flex flex-col">
      {/* 1. TopBar Contextual Fija */}
      <WineryPublicTopBar />

      {/* 2. Banner de Vista Previa para Dueño o Admin */}
      {profile.isPreview && (
        <div
          data-testid="winery-preview-banner"
          className="fixed top-14 left-0 right-0 z-40 bg-amber-500/15 backdrop-blur-md border-b border-amber-500/30 px-4 py-2 text-center text-xs font-mono text-amber-300 flex items-center justify-center gap-2 shadow-lg"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Vista previa: así la verán los usuarios cuando te aprueben</span>
        </div>
      )}

      {/* 3. Contenedor Principal con offset para TopBar fija (y cartel de preview si aplica) */}
      <div className={cn('flex-1 flex flex-col', profile.isPreview ? 'pt-24' : 'pt-14')}>
        {/* BANNER DINÁMICO Vitivinícola o Fotografía Oficial */}
        <WineryBanner
          wineryName={profile.name}
          bannerUrl={profile.bannerUrl}
          heightClassName="h-44 sm:h-52 md:h-60 lg:h-64"
        />

        {/* CABECERA INSTITUCIONAL */}
        <header className="w-full bg-[#0b0b0e] border-b border-white/5 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6 pt-0">
              {/* Bloque Izquierdo: Logo Circular Flotante + Nombre + Metadatos */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 flex-1 min-w-0">
                <div className="-mt-14 sm:-mt-16 md:-mt-20 relative z-20 shrink-0">
                  <div
                    className={cn(
                      'w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-[#0b0b0e] shadow-2xl border border-white/15 flex items-center justify-center p-2.5 sm:p-3 transition-transform',
                      profile.logoUrl ? 'bg-white' : 'bg-[#17151a]'
                    )}
                  >
                    <WineryLogo
                      src={profile.logoUrl}
                      name={profile.name}
                      size="lg"
                      objectFit="contain"
                      className="h-full w-full object-contain rounded-full bg-transparent border-0 shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 sm:pt-3 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white">
                      {profile.name}
                    </h1>
                    {profile.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-0.5 rounded-full font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Bodega oficial
                      </span>
                    )}
                  </div>

                  {/* Metadatos institucionales: Región, Año de fundación, Sitio Web */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{locationLabel}</span>
                    </span>

                    {typeof profile.foundationYear === 'number' && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Fundada en {profile.foundationYear}</span>
                      </span>
                    )}

                    {profile.website && (
                      <a
                        href={
                          /^https?:\/\//i.test(profile.website)
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-300 hover:text-white underline decoration-white/30 hover:decoration-white transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Sitio web</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                  </div>

                  {/* Seguidores y Valoración */}
                  <div className="flex items-center gap-4 text-xs font-mono pt-1 text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        <strong className="text-white font-semibold">{followersCount}</strong>{' '}
                        {followersCount === 1 ? 'seguidor' : 'seguidores'}
                      </span>
                    </span>

                    <span className="text-zinc-700">·</span>

                    <span className="inline-flex items-center gap-1.5">
                      {typeof profile.averageRating === 'number' ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          <span className="text-amber-300 font-semibold">
                            {profile.averageRating.toFixed(1)}
                          </span>
                          <span className="text-zinc-500">
                            ({profile.reviewCount} {profile.reviewCount === 1 ? 'reseña' : 'reseñas'})
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-500">
                          {profile.reviewCount > 0
                            ? `${profile.reviewCount} ${profile.reviewCount === 1 ? 'reseña' : 'reseñas'} · Aún sin valoración`
                            : 'Sin valoraciones'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque Derecho: Acciones (Seguir / Siguiendo y Copiar Enlace) */}
              <div className="flex items-center gap-2.5 pt-2 sm:pt-4 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={isFollowingPending}
                  className={cn(
                    'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60',
                    isFollowing
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
                      : 'bg-[#6e1a24] hover:bg-[#85222e] text-white shadow-rose-950/50',
                  )}
                  aria-label={isFollowing ? 'Dejar de seguir bodega' : 'Seguir bodega'}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Siguiendo</span>
                    </>
                  ) : (
                    <span>Seguir bodega</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer relative"
                  title="Copiar enlace a esta bodega"
                  aria-label="Copiar enlace de bodega"
                >
                  {copiedToast ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedToast && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-200 px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                      ¡Enlace copiado!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN (NAVLINK) */}
            <nav
              aria-label="Pestañas de perfil público"
              className="flex items-center gap-8 mt-8 border-t border-white/5 pt-1"
            >
              <NavLink
                to={`/bodegas/${profile.id}`}
                end
                className={({ isActive }) =>
                  cn(
                    'py-3 text-sm font-medium transition-colors relative cursor-pointer',
                    isActive
                      ? 'text-white border-b-2 border-rose-500'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )
                }
              >
                La bodega
              </NavLink>

              <NavLink
                to={`/bodegas/${profile.id}/catalogo`}
                className={({ isActive }) =>
                  cn(
                    'py-3 text-sm font-medium transition-colors relative cursor-pointer flex items-center gap-2',
                    isActive
                      ? 'text-white border-b-2 border-rose-500'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )
                }
              >
                <span>Catálogo</span>
                {profile.totals.labels > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    {profile.totals.labels}
                  </span>
                )}
              </NavLink>
            </nav>
          </div>
        </header>

        {/* CONTENIDO HIJO (OUTLET) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {contextValue && <Outlet context={contextValue} />}
        </main>
      </div>
    </div>
  );
}
