namespace AyVino.Api.Features.Cellars.DTOs;

public record PublicCellarItemResponseDto(
    int WineVintageId,
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    int? Year,
    string? ImageUrl,
    decimal? AverageRating,
    int ReviewCount);

