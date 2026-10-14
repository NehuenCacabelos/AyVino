namespace AyVino.Api.Features.Wines.DTOs;

public record WineResponseDto(
    int Id,
    int? WineryId,
    string? WineryNameText,
    string Name,
    string? Description,
    string WineType,
    int? LocationId,
    string SourceType,
    int? DuplicateOfWineId,
    decimal? AverageRating,
    int ReviewCount);