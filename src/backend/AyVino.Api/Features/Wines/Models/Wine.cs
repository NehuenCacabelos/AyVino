using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines.Models;

public record Wine
{
    public int Id { get; init; }
    public int? WineryId { get; init; }
    public string? WineryNameText { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public WineType WineType { get; init; }
    public int? LocationId { get; init; }
    public SourceType SourceType { get; init; }
    public int? DuplicateOfWineId { get; init; }
    public int RatingSum { get; init; }
    public int ReviewCount { get; init; }
}