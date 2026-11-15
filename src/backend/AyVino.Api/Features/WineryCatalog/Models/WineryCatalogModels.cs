using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.WineryCatalog.Models;

public record WineryCatalogOwnerWinery(int Id, WineryStatus Status)
{
    public WineryCatalogOwnerWinery() : this(0, WineryStatus.Pending) { }
}

public record WineryCatalogTotalsRow(
    int TotalLabels,
    int TotalVintages,
    int VintagesApproved,
    int VintagesPending,
    int VintagesRejected)
{
    public WineryCatalogTotalsRow() : this(0, 0, 0, 0, 0) { }
}

public record WineryCatalogWineRow(
    int Id,
    string Name,
    string? Description,
    WineType WineType,
    SourceType SourceType,
    int RatingSum,
    int ReviewCount)
{
    public WineryCatalogWineRow() : this(0, string.Empty, null, WineType.Red, SourceType.Community, 0, 0) { }
}

public record WineryCatalogVintageRow(
    int Id,
    int WineId,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    Guid? ImageId,
    ApprovalStatus ApprovalStatus,
    DateTime RegisterDate,
    int RatingSum,
    int ReviewCount)
{
    public WineryCatalogVintageRow() : this(0, 0, null, null, null, null, null, ApprovalStatus.Pending, default, 0, 0) { }
}

public record WineryCatalogGrapeRow(
    int WineVintageId,
    int GrapeId,
    string GrapeName,
    decimal? Percentage)
{
    public WineryCatalogGrapeRow() : this(0, 0, string.Empty, null) { }
}

public record WineryPublicProfileRow(
    int Id,
    string Name,
    string? Description,
    int? FoundationYear,
    string? Website,
    int? UserId,
    WineryStatus Status,
    DateTime RegisterDate,
    decimal? Latitude,
    decimal? Longitude,
    Guid? LogoImageId,
    Guid? BannerImageId,
    string? StateName,
    string? RegionName)
{
    public WineryPublicProfileRow() : this(
        0, string.Empty, null, null, null, null, WineryStatus.Pending, default, null, null, null, null, null, null) { }
}

public record WineryPublicRatingsAndTotalsRow(
    int Labels,
    int Vintages,
    long RatingSum,
    int ReviewCount)
{
    public WineryPublicRatingsAndTotalsRow() : this(0, 0, 0, 0) { }
}

public record WineryPublicCatalogQueryParams(
    int PageNumber = 1,
    int PageSize = 12,
    string? Search = null,
    string? WineType = null,
    int? GrapeId = null,
    int? Year = null,
    string? Sort = "name");
