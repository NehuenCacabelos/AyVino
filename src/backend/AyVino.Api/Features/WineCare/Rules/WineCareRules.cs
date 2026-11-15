using AyVino.Api.Features.WineCare.Enums;
using AyVino.Api.Features.WineCare.Models;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.WineCare.Rules;

// Motor de reglas: función pura, sin base de datos y sin reloj (el año actual entra por parámetro).
// Son reglas generales de la industria, orientativas: no reemplazan la indicación de la bodega.
public static class WineCareRules
{
    // Una temperatura cargada a mano solo se respeta si es razonable para servir vino.
    private const int MinSensibleServingTemperature = 4;
    private const int MaxSensibleServingTemperature = 20;

    // Umbrales sobre el promedio de estructura (escala 1 a 5).
    private const decimal HighStructure = 3.5m;
    private const decimal MediumStructure = 2.5m;

    // Un tinto con más años que esto se decanta solo por el sedimento.
    private const int MatureRedAgeYears = 10;

    public static WineCareResult Evaluate(WineCareInput input, int currentYear) => new(
        EvaluateServingTemperature(input),
        EvaluateDecanting(input, currentYear),
        EvaluateDrinkingWindow(input, currentYear),
        input.DeclaredAgingAdvice);

    private static ServingTemperatureAdvice EvaluateServingTemperature(WineCareInput input)
    {
        if (input.DeclaredServingTemperature is >= MinSensibleServingTemperature and <= MaxSensibleServingTemperature)
        {
            var declared = input.DeclaredServingTemperature.Value;
            return new ServingTemperatureAdvice(declared, declared, AdviceSource.Declared);
        }

        var (min, max) = input.WineType switch
        {
            WineType.Sparkling => (6, 8),
            WineType.White => (7, 12),
            WineType.Rose => (7, 12),
            WineType.Orange => (10, 13),
            WineType.Red => (14, 19),
            _ => throw new ArgumentOutOfRangeException(nameof(input), input.WineType, "Tipo de vino no soportado.")
        };

        return new ServingTemperatureAdvice(min, max, AdviceSource.Inferred);
    }

    private static DecantingAdvice EvaluateDecanting(WineCareInput input, int currentYear)
    {
        if (input.WineType != WineType.Red)
            return new DecantingAdvice(false, null, "No necesita decantado: se sirve directo de la botella.");

        if (input.Year is not null && currentYear - input.Year.Value > MatureRedAgeYears)
            return new DecantingAdvice(true, 0,
                "Tinto maduro: decantalo solo para separar el sedimento y servilo enseguida, sin airearlo.");

        // Sin datos de uva se asume estructura media.
        var structure = input.StructureScore ?? MediumStructure;

        if (structure >= HighStructure)
            return new DecantingAdvice(true, 60, "Tinto joven con estructura marcada: el aire ayuda a suavizar los taninos.");

        if (structure >= MediumStructure)
            return new DecantingAdvice(true, 30, "Tinto joven de estructura media: unos minutos de aire lo abren.");

        return new DecantingAdvice(false, null, "Tinto liviano: no necesita decantado.");
    }

    private static DrinkingWindowAdvice? EvaluateDrinkingWindow(WineCareInput input, int currentYear)
    {
        // Sin añada no se puede calcular la edad: se evita inventar una ventana.
        if (input.Year is null) return null;

        var (fromYears, untilYears) = WindowInYears(input);
        var fromYear = input.Year.Value + fromYears;
        var untilYear = input.Year.Value + untilYears;

        var status = currentYear switch
        {
            _ when currentYear < fromYear => DrinkingStatus.TooYoung,
            _ when currentYear > untilYear => DrinkingStatus.PastPeak,
            _ when currentYear == untilYear => DrinkingStatus.DrinkSoon,
            _ => DrinkingStatus.InWindow
        };

        return new DrinkingWindowAdvice(fromYear, untilYear, status);
    }

    // Años desde la cosecha. Blancos, rosados, espumosos y naranjos están listos desde el principio
    // y la franja indica hasta cuándo se mantienen frescos. Los tintos necesitan tiempo y dependen de la estructura.
    private static (int From, int Until) WindowInYears(WineCareInput input) => input.WineType switch
    {
        WineType.White => (0, 3),
        WineType.Rose => (0, 2),
        WineType.Sparkling => (0, 5),
        WineType.Orange => (0, 5),
        WineType.Red => RedWindow(input.StructureScore ?? MediumStructure),
        _ => throw new ArgumentOutOfRangeException(nameof(input), input.WineType, "Tipo de vino no soportado.")
    };

    private static (int From, int Until) RedWindow(decimal structure) =>
        structure >= HighStructure ? (8, 15)
        : structure >= MediumStructure ? (4, 10)
        : (2, 5);
}