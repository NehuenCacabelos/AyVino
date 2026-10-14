namespace AyVino.Api.Features.Users.Models;

public record UserCredential
{
    public int UserId { get; init; }
    public string PasswordHash { get; init; } = string.Empty;
    public DateTime LastPasswordChange { get; init; } = DateTime.UtcNow;
    public int FailedLoginAttempts { get; init; } = 0;
    public DateTime? BlockedUntil { get; init; }
}

