namespace AyVino.Api.Features.Wines.DTOs;

public record WineGrapeResponseDto(int GrapeId, decimal? Percentage);

public record WineResponseDto(
    int Id,
    int? WineryId,
    string Name,
    string? Description,
    string WineType,
    int? LocationId,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    string? LabelImageUrl,
    string ApprovalStatus,
    int UploadedByUserId,
    DateTime RegisterDate,
    IEnumerable<WineGrapeResponseDto> Grapes);