using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.UserWines.Models;

// Fila del listado: datos básicos del vino + las tres marcas del usuario.
public record UserWineListRow
{
    public int WineId { get; init; }
    public string Name { get; init; } = string.Empty;
    public WineType WineType { get; init; }
    public int? WineryId { get; init; }
    public string? WineryNameText { get; init; }
    public int RatingSum { get; init; }
    public int ReviewCount { get; init; }
    public bool IsWanted { get; init; }
    public bool IsTried { get; init; }
    public bool IsFavorite { get; init; }
    public DateTime LastChangeAt { get; init; }
}