using AyVino.Api.Features.Audit.Enums;

namespace AyVino.Api.Features.Audit.Models;

public sealed record AuditLogEntry
{
    public int Id { get; init; }
    public int? UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public AuditAction Action { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public int? EntityId { get; init; }
    public string? Details { get; init; }
    public DateTime CreatedAt { get; init; }
}
