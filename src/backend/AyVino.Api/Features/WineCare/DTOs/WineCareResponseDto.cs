namespace AyVino.Api.Features.WineCare.DTOs;

public record ServingTemperatureDto(int MinCelsius, int MaxCelsius, string Source);

public record DecantingDto(bool Recommended, int? Minutes, string Reason);

public record DrinkingWindowDto(int FromYear, int UntilYear, string Status);

public record WineCareResponseDto(
    int WineVintageId,
    ServingTemperatureDto ServingTemperature,
    DecantingDto Decanting,
    DrinkingWindowDto? DrinkingWindow,
    string? DeclaredAgingAdvice);