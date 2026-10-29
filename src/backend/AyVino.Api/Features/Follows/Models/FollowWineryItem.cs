namespace AyVino.Api.Features.Follows.Models;

public record FollowWineryItem
{
    public int WineryId { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime FollowedAt { get; init; }
}