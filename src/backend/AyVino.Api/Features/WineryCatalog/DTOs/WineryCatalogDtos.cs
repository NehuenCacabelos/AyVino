namespace AyVino.Api.Features.WineryCatalog.DTOs;

public record WineryCatalogTotalsDto(
    int Labels,
    int Vintages,
    int VintagesApproved,
    int VintagesPending,
    int VintagesRejected);

public record WineryCatalogGrapeDto(
    int GrapeId,
    string GrapeName,
    decimal? Percentage);

public record WineryCatalogVintageDto(
    int Id,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    Guid? ImageId,
    string ApprovalStatus,
    decimal? AverageRating,
    int ReviewCount,
    DateTime RegisterDate,
    IReadOnlyList<WineryCatalogGrapeDto> Grapes);

public record WineryCatalogWineDto(
    int Id,
    string Name,
    string? Description,
    string WineType,
    string SourceType,
    decimal? AverageRating,
    int ReviewCount,
    IReadOnlyList<WineryCatalogVintageDto> Vintages);

public record WineryCatalogResponseDto(
    int WineryId,
    string WineryStatus,
    WineryCatalogTotalsDto Totals,
    bool HasMore,
    IReadOnlyList<WineryCatalogWineDto> Wines);
