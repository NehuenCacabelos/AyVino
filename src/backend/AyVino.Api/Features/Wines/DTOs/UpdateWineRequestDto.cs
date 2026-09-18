namespace AyVino.Api.Features.Wines.DTOs;

public record UpdateWineRequestDto(
    string Name,
    string WineType,
    int? WineryId = null,
    string? Description = null,
    int? LocationId = null,
    int? Year = null,
    decimal? AlcoholContent = null,
    int? ServingTemperature = null,
    string? AgingAdvice = null,
    string? LabelImageUrl = null,
    List<WineGrapeRequestDto>? Grapes = null);