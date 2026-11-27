import apiClient from '../../../services/apiClient';
import type { AuditLogEntryDto, GetAuditLogsParams } from '../types/adminAudit';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

/**
 * Consulta el registro de auditoría con paginación y filtros opcionales.
 * GET /api/audit-log
 */
export async function getAuditLogs(
  params?: GetAuditLogsParams
): Promise<PagedResponse<AuditLogEntryDto>> {
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
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
}
