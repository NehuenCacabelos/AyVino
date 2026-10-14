namespace AyVino.Api.Features.Cellars.Models;

public record CellarItem
{
    public int CellarId { get; init; }
    public int WineVintageId { get; init; }
    public int Quantity { get; init; }
    public DateOnly? PurchaseDate { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}