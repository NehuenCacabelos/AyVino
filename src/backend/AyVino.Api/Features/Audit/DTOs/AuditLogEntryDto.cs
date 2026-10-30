namespace AyVino.Api.Features.Audit.DTOs;

public sealed record AuditLogEntryDto(
    int Id,
    int? UserId,
    string Username,
    string Action,
    string EntityType,
    int? EntityId,
    string? Details,
    DateTime CreatedAt
);
