namespace AyVino.Api.Features.UserWines.Models;

public record UserWine
{
    public int UserId { get; init; }
    public int WineId { get; init; }
    public bool IsWanted { get; init; }
    public bool IsTried { get; init; }
    public bool IsFavorite { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}