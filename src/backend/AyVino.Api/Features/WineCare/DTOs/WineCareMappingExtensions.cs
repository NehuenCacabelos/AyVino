using AyVino.Api.Features.WineCare.Models;

namespace AyVino.Api.Features.WineCare.DTOs;

public static class WineCareMappingExtensions
{
    public static WineCareResponseDto ToResponseDto(this WineCareResult result, int wineVintageId) => new(
        wineVintageId,
        new ServingTemperatureDto(
            result.ServingTemperature.MinCelsius,
            result.ServingTemperature.MaxCelsius,
            result.ServingTemperature.Source.ToString()),
        new DecantingDto(
            result.Decanting.Recommended,
            result.Decanting.Minutes,
            result.Decanting.Reason),
        result.DrinkingWindow is null
            ? null
            : new DrinkingWindowDto(
                result.DrinkingWindow.FromYear,
                result.DrinkingWindow.UntilYear,
                result.DrinkingWindow.Status.ToString()),
        result.DeclaredAgingAdvice);
}