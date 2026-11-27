using AyVino.Api.Common.Models;
using AyVino.Api.Features.Audit.DTOs;
using AyVino.Api.Features.Audit.Enums;

namespace AyVino.Api.Features.Audit.Services;

public interface IAuditService
{
    Task RecordAsync(int? userId, string username, AuditAction action, string entityType, int? entityId, string? details, CancellationToken ct = default);
    Task<IEnumerable<AuditLogEntryDto>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? action = null,
        string? entityType = null,
        int? userId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default);
    Task<PagedResult<AuditLogEntryDto>> GetPagedWithCountAsync(
        int pageNumber,
        int pageSize,
        string? action = null,
        string? entityType = null,
        int? userId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default) => Task.FromResult(new PagedResult<AuditLogEntryDto>([], 0));
}
