namespace AyVino.Api.Features.Cellars.Models;

public record Cellar
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}