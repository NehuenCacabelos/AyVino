namespace AyVino.Api.Features.Tastings.Models;

public record Tasting
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public int WineVintageId { get; init; }
    public int? CellarId { get; init; }
    public decimal? Rating { get; init; }
    public string? Comment { get; init; }
    public DateTime TastedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}
