namespace AyVino.Api.Features.Cellars.Models;

// Fila del listado de cavas: la cava + sus totales.
public record CellarSummaryRow
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int VintageCount { get; init; }
    public int BottleCount { get; init; }
    public DateTime CreatedAt { get; init; }
}