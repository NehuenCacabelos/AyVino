namespace AyVino.Api.Features.Auth.Models;

public record RefreshToken
{
    public string Token { get; init; } = string.Empty;
    public int UserId { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public string? CreatedByIp { get; init; }
    public DateTime? RevokedAt { get; init; }
    public string? RevokedByIp { get; init; }
    public string? ReplacedByToken { get; init; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsExpired && !IsRevoked;
}
