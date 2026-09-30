namespace AyVino.Api.Features.Wines.DTOs;

public record WineGrapeResponseDto(int GrapeId, decimal? Percentage);

public record WineVintageResponseDto(
    int Id,
    int WineId,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    string? ImageUrl,
    string ApprovalStatus,
    int UploadedByUserId,
    DateTime RegisterDate,
    decimal? AverageRating,
    int ReviewCount,
    IEnumerable<WineGrapeResponseDto> Grapes);