namespace AyVino.Api.Features.Sensory.Models;

public record WineVintageSensory
{
    public int WineVintageId { get; init; }
    public decimal? Body { get; init; }
    public decimal? Tannins { get; init; }
    public decimal? Acidity { get; init; }
    public decimal? Fruit { get; init; }
    public decimal? Oak { get; init; }
    public decimal? Persistence { get; init; }
    public DateTime UpdatedAt { get; init; }
}
