using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Audit.DTOs;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Models;
using AyVino.Api.Features.Audit.Repositories;

namespace AyVino.Api.Features.Audit.Services;

public class AuditService(IAuditRepository repository, ILogger<AuditService> logger) : IAuditService
{
    public async Task RecordAsync(int? userId, string username, AuditAction action, string entityType, int? entityId, string? details, CancellationToken ct = default)
    {
        try
        {
            var entry = new AuditLogEntry
            {
                UserId = userId,
                Username = string.IsNullOrWhiteSpace(username) ? "Sistema" : username,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };

            await repository.CreateAsync(entry, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al registrar entrada de auditoría para acción {Action} en {EntityType} #{EntityId}", action, entityType, entityId);
        }
    }

    public async Task<IEnumerable<AuditLogEntryDto>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? action = null,
        string? entityType = null,
        int? userId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");

        short? actionValue = null;
        if (!string.IsNullOrWhiteSpace(action))
        {
            if (!Enum.TryParse<AuditAction>(action, ignoreCase: true, out var parsedAction))
                throw new ValidationException($"Acción de auditoría inválida: '{action}'.");

            actionValue = (short)parsedAction;
        }

        var entries = await repository.GetPagedAsync(pageNumber, pageSize, actionValue, entityType, userId, from, to, ct);
        return entries.ToDtoList();
    }
}
