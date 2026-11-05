/**
 * Obtiene las 2 iniciales representativas de una bodega a partir de su nombre.
 */
export function getWineryInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'BO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
