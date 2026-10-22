using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.WineCare.Models;

// Lo único que necesita el motor. No sabe nada de base de datos ni de otras features.
// StructureScore: promedio de cuerpo, taninos y acidez de las uvas, en escala 1 a 5 (null si ninguna uva tiene perfil).
public record WineCareInput(
    WineType WineType,
    int? Year,
    decimal? StructureScore,
    int? DeclaredServingTemperature,
    string? DeclaredAgingAdvice);