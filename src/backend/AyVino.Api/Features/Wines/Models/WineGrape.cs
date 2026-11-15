namespace AyVino.Api.Features.Wines.Models;

public record WineGrape
{
    public int WineVintageId { get; init; }
    public int GrapeId { get; init; }
    public decimal? Percentage { get; init; }
}