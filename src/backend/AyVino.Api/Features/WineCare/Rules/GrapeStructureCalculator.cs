using AyVino.Api.Features.WineCare.Models;

namespace AyVino.Api.Features.WineCare.Rules;

// Resume las uvas de una cosecha en un solo número de 1 a 5 (cuerpo, taninos y acidez).
// Las escalas del catálogo son 10..50, así que dividir por 10 da el nivel 1..5.
public static class GrapeStructureCalculator
{
    public static decimal? Calculate(IEnumerable<WineCareGrapeRow> grapes)
    {
        var profiled = grapes
            .Select(g => (g.Percentage, Level: LevelOf(g)))
            .Where(x => x.Level is not null)
            .ToList();

        if (profiled.Count == 0) return null;

        // Si todas las uvas con perfil traen porcentaje, se pondera. Si falta alguno, promedio simple.
        var useWeights = profiled.All(x => x.Percentage is > 0);
        if (!useWeights)
            return Math.Round(profiled.Average(x => x.Level!.Value), 2);

        var totalWeight = profiled.Sum(x => x.Percentage!.Value);
        var weighted = profiled.Sum(x => x.Level!.Value * x.Percentage!.Value) / totalWeight;
        return Math.Round(weighted, 2);
    }

    // Promedio de los atributos que la uva sí tiene cargados (son opcionales). null si no tiene ninguno.
    private static decimal? LevelOf(WineCareGrapeRow grape)
    {
        var values = new[] { (int?)grape.TypicalBody, (int?)grape.TypicalTannins, (int?)grape.TypicalAcidity }
            .Where(v => v is not null)
            .Select(v => v!.Value / 10m)
            .ToList();

        return values.Count == 0 ? null : values.Average();
    }
}