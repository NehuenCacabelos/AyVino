using AyVino.Api.Features.Catalog.DTOs;

namespace AyVino.Api.Features.Catalog.Services;

public interface ICatalogService
{
    Task<CatalogShowcaseResponseDto> GetShowcaseAsync(
        string? q,
        string? wineType,
        int? grapeId,
        int? locationId,
        int pageNumber = 1,
        int pageSize = 6,
        int winesPerWinery = 8,
        CancellationToken ct = default);

    Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default);
}
