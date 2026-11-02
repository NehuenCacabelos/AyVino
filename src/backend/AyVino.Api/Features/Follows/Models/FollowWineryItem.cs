namespace AyVino.Api.Features.Follows.Models;

public record FollowWineryItem
{
    public int WineryId { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime FollowedAt { get; init; }
    public Guid? LogoImageId { get; init; }
    public string? StateName { get; init; }
    public string? RegionName { get; init; }
    public int LabelsCount { get; init; }
    public int FollowersCount { get; init; }
}
