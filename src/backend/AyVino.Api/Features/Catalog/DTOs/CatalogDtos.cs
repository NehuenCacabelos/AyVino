using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Catalog.DTOs;

public record CatalogShowcaseWineryDto(
    int? WineryId,
    string WineryName,
    string? Location,
    Guid? LogoImageId,
    bool IsVerified,
    IReadOnlyList<WineListItemDto> Wines);

public record CatalogShowcaseResponseDto(
    IReadOnlyList<CatalogShowcaseWineryDto> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasNextPage);

public record CatalogFilterOptionDto(
    int Id,
    string Name,
    int? Count = null);

public record CatalogFiltersResponseDto(
    IReadOnlyList<CatalogFilterOptionDto> Varietals,
    IReadOnlyList<CatalogFilterOptionDto> Regions,
    IReadOnlyList<CatalogFilterOptionDto> Wineries);
