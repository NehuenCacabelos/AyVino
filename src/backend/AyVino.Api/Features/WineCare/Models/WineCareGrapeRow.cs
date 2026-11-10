using AyVino.Api.Features.Grapes.Enums;

namespace AyVino.Api.Features.WineCare.Models;

// Fila del JOIN wine_grapes + grapes: el porcentaje en la cosecha y el perfil de la uva.
public record WineCareGrapeRow
{
    public int WineVintageId { get; init; }
    public decimal? Percentage { get; init; }
    public TypicalBody? TypicalBody { get; init; }
    public TypicalTannins? TypicalTannins { get; init; }
    public TypicalAcidity? TypicalAcidity { get; init; }
}