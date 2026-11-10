export const AUDIT_ACTION_LABELS: Record<string, string> = {
  WineryStatusChanged: 'Cambio de estado de bodega',
  WineryDeleted: 'Eliminación de bodega',
  CityStatusChanged: 'Cambio de estado de ciudad',
  VintageStatusChanged: 'Cambio de estado de cosecha',
  VintageDeleted: 'Eliminación de cosecha',
  UserStatusChanged: 'Bloqueo/desbloqueo de usuario',
  UserDeleted: 'Eliminación de usuario',
  UserRoleChanged: 'Cambio de rol de usuario',
  GrapeCreated: 'Alta de uva',
  GrapeUpdated: 'Edición de uva',
  GrapeDeleted: 'Eliminación de uva',
  PairingCreated: 'Alta de maridaje',
  PairingUpdated: 'Edición de maridaje',
  PairingDeleted: 'Eliminación de maridaje',
  WineUpdatedByAdmin: 'Edición de vino por admin',
  WineDeleted: 'Eliminación de vino',
  ReviewDeletedByAdmin: 'Eliminación de reseña por admin',
  WineMerged: 'Fusión de vinos',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Winery: 'Bodega',
  City: 'Ciudad',
  Vintage: 'Cosecha',
  User: 'Usuario',
  Grape: 'Uva',
  Pairing: 'Maridaje',
  Wine: 'Vino',
  Review: 'Reseña',
};

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const AUDIT_ENTITY_OPTIONS = Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function getAuditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}

export function getEntityLink(entityType: string, entityId: number | null): string | null {
  if (entityId == null) return null;
  switch (entityType) {
    case 'Winery':
      return '/admin/bodegas';
    case 'City':
      return '/admin/ciudades';
    case 'Vintage':
      return '/admin/cosechas';
    case 'User':
      return '/admin/usuarios';
    case 'Grape':
      return '/admin/uvas';
    case 'Pairing':
      return '/admin/maridajes';
    case 'Wine':
      return '/admin/vinos';
    case 'Review':
      return '/admin/resenas';
    default:
      return null;
  }
}
