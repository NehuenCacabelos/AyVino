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
    Guid? ImageId,
    string ApprovalStatus,
    int UploadedByUserId,
    string? UploadedByUsername,
    DateTime RegisterDate
);
