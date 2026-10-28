using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.WineryCatalog.Models;

public record WineryCatalogOwnerWinery(int Id, WineryStatus Status);

public record WineryCatalogTotalsRow(
    int TotalLabels,
    int TotalVintages,
    int VintagesApproved,
    int VintagesPending,
    int VintagesRejected);

public record WineryCatalogWineRow(
    int Id,
    string Name,
    string? Description,
    WineType WineType,
    SourceType SourceType,
    int RatingSum,
    int ReviewCount);

public record WineryCatalogVintageRow(
    int Id,
    int WineId,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    string? ImageUrl,
    ApprovalStatus ApprovalStatus,
    DateTime RegisterDate,
    int RatingSum,
    int ReviewCount);

public record WineryCatalogGrapeRow(
    int WineVintageId,
    int GrapeId,
    string GrapeName,
    decimal? Percentage);

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
    string? LogoUrl,
    string? BannerUrl,
    string? StateName,
    string? RegionName);

public record WineryPublicRatingsAndTotalsRow(
    int Labels,
    int Vintages,
    long RatingSum,
    int ReviewCount);

public record WineryPublicCatalogQueryParams(
    int PageNumber = 1,
    int PageSize = 12,
    string? Search = null,
    string? WineType = null,
    int? GrapeId = null,
    int? Year = null,
    string? Sort = "name");
