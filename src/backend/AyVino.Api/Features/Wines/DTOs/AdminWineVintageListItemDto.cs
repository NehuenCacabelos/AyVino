namespace AyVino.Api.Features.Wines.DTOs;

public record AdminWineVintageListItemDto(
    int VintageId,
    int WineId,
    string WineName,
    string WineType,
    int? WineryId,
    string? WineryName,
    int? Year,
    decimal? AlcoholContent,
    string? ImageUrl,
    string ApprovalStatus,
    int UploadedByUserId,
    string? UploadedByUsername,
    DateTime RegisterDate
);
