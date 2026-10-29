namespace AyVino.Api.Features.WineryCatalog.DTOs;

public record WineryPublicLocationDto(
    string? StateName,
    string? RegionName);

public record WineryPublicTotalsDto(
    int Labels,
    int Vintages);

public record WineryPublicProfileResponseDto(
    int Id,
    string Name,
    string? Description,
    int? FoundationYear,
    string? Website,
    string Status,
    DateTime RegisterDate,
    decimal? Latitude,
    decimal? Longitude,
    string? LogoUrl,
    string? BannerUrl,
    WineryPublicLocationDto? Location,
    int FollowersCount,
    bool? IsFollowedByMe,
    WineryPublicTotalsDto Totals,
    decimal? AverageRating,
    int ReviewCount,
    bool IsPreview,
    bool IsOwner = false);

public record WineryPublicGrapeFilterDto(
    int Id,
    string Name);

public record WineryPublicCatalogFiltersDto(
    IReadOnlyList<string> WineTypes,
    IReadOnlyList<WineryPublicGrapeFilterDto> Grapes,
    IReadOnlyList<int> Years);

public record WineryPublicCatalogGrapeDto(
    int GrapeId,
    string GrapeName,
    decimal? Percentage);

public record WineryPublicCatalogVintageDto(
    int Id,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    string? ImageUrl,
    string ApprovalStatus,
    decimal? AverageRating,
    int ReviewCount,
    IReadOnlyList<WineryPublicCatalogGrapeDto> Grapes);

public record WineryPublicCatalogWineDto(
    int Id,
    string Name,
    string? Description,
    string WineType,
    string SourceType,
    decimal? AverageRating,
    int ReviewCount,
    IReadOnlyList<WineryPublicCatalogVintageDto> Vintages);

public record WineryPublicCatalogResponseDto(
    IReadOnlyList<WineryPublicCatalogWineDto> Items,
    WineryPublicCatalogFiltersDto Filters,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage)
{
    public IReadOnlyList<WineryPublicCatalogWineDto> Wines => Items;
}
