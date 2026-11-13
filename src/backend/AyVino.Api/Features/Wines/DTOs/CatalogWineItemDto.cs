namespace AyVino.Api.Features.Wines.DTOs;

public record CatalogWineItemDto(
    int Id,
    int? WineryId,
    string? WineryNameText,
    string? WineryName,
    string Name,
    string? Description,
    string WineType,
    int? LocationId,
    string? RegionName,
    string? Varietal,
    int? Vintage,
    Guid? ImageId,
    string? ImageUrl,
    string SourceType,
    int? DuplicateOfWineId,
    decimal? AverageRating,
    int ReviewCount,
    Guid? WineryLogoImageId = null);

