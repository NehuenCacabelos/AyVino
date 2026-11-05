using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.WineCare.Models;

// Fila del JOIN cosecha + etiqueta.
public record WineCareVintageRow
{
    public int WineVintageId { get; init; }
    public int WineId { get; init; }
    public WineType WineType { get; init; }
    public int? Year { get; init; }
    public int? ServingTemperature { get; init; }
    public string? AgingAdvice { get; init; }
}