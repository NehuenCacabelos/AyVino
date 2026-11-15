using AyVino.Api.Features.Audit.Models;

namespace AyVino.Api.Features.Audit.Repositories;

public interface IAuditRepository
{
    Task<AuditLogEntry> CreateAsync(AuditLogEntry entry, CancellationToken ct = default);
    Task<IEnumerable<AuditLogEntry>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        short? action = null,
        string? entityType = null,
        int? userId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default);
}
