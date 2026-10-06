using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Cellars.Models;

public record CellarItemListRow
{
    public int WineVintageId { get; init; }
    public int WineId { get; init; }
    public string Name { get; init; } = string.Empty;
    public WineType WineType { get; init; }
    public int? WineryId { get; init; }
    public string? WineryNameText { get; init; }
    public int? Year { get; init; }
    public string? ImageUrl { get; init; }
    public int RatingSum { get; init; }
    public int ReviewCount { get; init; }
    public int Quantity { get; init; }
    public DateOnly? PurchaseDate { get; init; }
    public string? Notes { get; init; }
    public DateTime LastChangeAt { get; init; }
}