using AyVino.Api.Features.Audit.Models;

namespace AyVino.Api.Features.Audit.DTOs;

public static class AuditMappingExtensions
{
    public static AuditLogEntryDto ToDto(this AuditLogEntry entity) =>
        new(
            entity.Id,
            entity.UserId,
            entity.Username,
            entity.Action.ToString(),
            entity.EntityType,
            entity.EntityId,
            entity.Details,
            entity.CreatedAt
        );

    public static IEnumerable<AuditLogEntryDto> ToDtoList(this IEnumerable<AuditLogEntry> entities) =>
        entities.Select(e => e.ToDto());
}
