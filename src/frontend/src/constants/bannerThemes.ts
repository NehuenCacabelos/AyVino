/**
 * Catálogo de temas de banner y selector determinista por usuario.
 * Inspirado en la estética vitivinícola y tonos de guarda.
 */

export interface BannerTheme {
  id: string;
  name: string;
  classes: string;
  radialOverlayClass: string;
}

export const BANNER_THEMES: readonly BannerTheme[] = [
  {
    id: 'gran-reserva',
    name: 'Gran Reserva',
    classes: 'bg-gradient-to-b from-[#3a0d18] via-[#1c070c] to-[#0b0b0e]',
    radialOverlayClass: 'from-rose-900/25',
  },
  {
    id: 'cava-nocturna',
    name: 'Cava Nocturna',
    classes: 'bg-gradient-to-b from-[#1c1d22] via-[#121316] to-[#0b0b0e]',
    radialOverlayClass: 'from-zinc-700/20',
  },
  {
    id: 'roble-tostado',
    name: 'Roble Tostado',
    classes: 'bg-gradient-to-b from-[#2d1b0d] via-[#160d06] to-[#0b0b0e]',
    radialOverlayClass: 'from-amber-900/25',
  },
  {
    id: 'sauvignon-oliva',
    name: 'Sauvignon Oliva',
    classes: 'bg-gradient-to-b from-[#162118] via-[#0d130e] to-[#0b0b0e]',
    radialOverlayClass: 'from-emerald-950/30',
  },
  {
    id: 'cosecha-tardia',
    name: 'Cosecha Tardía',
    classes: 'bg-gradient-to-b from-[#2a0e2a] via-[#150715] to-[#0b0b0e]',
    radialOverlayClass: 'from-fuchsia-950/30',
  },
] as const;

/**
 * Obtiene el tema de banner predeterminado ('gran-reserva').
 */
export const DEFAULT_BANNER_THEME: BannerTheme = BANNER_THEMES[0];

/**
 * Asigna de forma determinista y consistente siempre el mismo banner a un usuario
 * basado en el hash de su username (case-insensitive).
 *
 * @param username Nombre de usuario a evaluar
 * @returns El BannerTheme correspondiente o fallback a 'gran-reserva'
 */
export function getBannerThemeByUsername(username?: string | null): BannerTheme {
  if (!username || !username.trim()) {
    return DEFAULT_BANNER_THEME;
  }

  const clean = username.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }

  const index = hash % BANNER_THEMES.length;
  return BANNER_THEMES[index];
}

