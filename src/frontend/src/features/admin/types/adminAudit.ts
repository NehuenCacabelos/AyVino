export interface AuditLogEntryDto {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details: string | null;
  createdAt: string;
}

export interface GetAuditLogsParams {
  pageNumber?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  userId?: number;
  from?: string;
  to?: string;
}
