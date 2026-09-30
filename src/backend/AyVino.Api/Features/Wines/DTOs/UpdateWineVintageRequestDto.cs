namespace AyVino.Api.Features.Wines.DTOs;

public record UpdateWineVintageRequestDto(
    int? Year = null,
    decimal? AlcoholContent = null,
    int? ServingTemperature = null,
    string? AgingAdvice = null,
    string? ImageUrl = null,
    List<WineGrapeRequestDto>? Grapes = null);