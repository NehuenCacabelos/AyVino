import apiClient from '../../../services/apiClient';
import type { AuditLogEntryDto, GetAuditLogsParams } from '../types/adminAudit';

/**
 * Consulta el registro de auditoría con paginación y filtros opcionales.
 * GET /api/audit-log
 */
export async function getAuditLogs(params?: GetAuditLogsParams): Promise<AuditLogEntryDto[]> {
  const response = await apiClient.get<AuditLogEntryDto[]>('/audit-log', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      action: params?.action || undefined,
      entityType: params?.entityType || undefined,
      userId: params?.userId || undefined,
      from: params?.from || undefined,
      to: params?.to || undefined,
    },
  });
  return response.data;
}
