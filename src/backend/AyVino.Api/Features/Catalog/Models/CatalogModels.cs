namespace AyVino.Api.Features.Catalog.Models;

public record ShowcaseWineryRow(
    string WineryKey,
    int? WineryId,
    string WineryName,
    string? Location,
    Guid? LogoImageId,
    bool IsVerified,
    int WineCount);

public record ShowcaseWineRow(
    string WineryKey,
    int Id,
    int? WineryId,
    string? WineryNameText,
    string Name,
    string? Description,
    int WineType,
    int? LocationId,
    int SourceType,
    int? DuplicateOfWineId,
    int RatingSum,
    int ReviewCount,
    Guid? ThumbnailImageId,
    int? ReferenceVintageYear);
