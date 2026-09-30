namespace AyVino.Api.Features.Wines.DTOs;

public record CreateWineVintageRequestDto(
    int UploadedByUserId,
    int? Year = null,
    decimal? AlcoholContent = null,
    int? ServingTemperature = null,
    string? AgingAdvice = null,
    string? ImageUrl = null,
    List<WineGrapeRequestDto>? Grapes = null);