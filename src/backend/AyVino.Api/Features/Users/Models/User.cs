namespace AyVino.Api.Features.Users.Models;

public record User
{
    public int Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = "User";
    public DateTime RegisterDate { get; init; } = DateTime.UtcNow;
    public bool IsActive { get; init; } = true;
    public string? Photo { get; init; }
    public string? Bio { get; init; }
}
