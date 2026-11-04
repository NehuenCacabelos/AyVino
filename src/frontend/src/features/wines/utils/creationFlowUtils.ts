export type WineNextActionDecision = 'auto-add' | 'prompt';

/**
 * Determina si tras crear o adoptar un vino se debe auto-agregar a la primera cava
 * o si se debe consultar al usuario qué desea hacer.
 */
export async function decidePostWineCreationAction(
  cellarsProvider: () => Promise<unknown[]>
): Promise<WineNextActionDecision> {
  try {
    const cellars = await cellarsProvider();
    return Array.isArray(cellars) && cellars.length === 0 ? 'auto-add' : 'prompt';
  } catch {
    return 'prompt';
  }
}
