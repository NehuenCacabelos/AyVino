using AyVino.Api.Features.WineCare.Enums;

namespace AyVino.Api.Features.WineCare.Models;

public record ServingTemperatureAdvice(int MinCelsius, int MaxCelsius, AdviceSource Source);

// Minutes: null = no se decanta; 0 = decantar solo para separar sedimento y servir enseguida.
public record DecantingAdvice(bool Recommended, int? Minutes, string Reason);

public record DrinkingWindowAdvice(int FromYear, int UntilYear, DrinkingStatus Status);

public record WineCareResult(
    ServingTemperatureAdvice ServingTemperature,
    DecantingAdvice Decanting,
    DrinkingWindowAdvice? DrinkingWindow,
    string? DeclaredAgingAdvice);