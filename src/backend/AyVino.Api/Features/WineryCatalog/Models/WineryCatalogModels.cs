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
