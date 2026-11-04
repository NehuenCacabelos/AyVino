using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Models;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Catalog.Repositories;

public interface ICatalogRepository
{
    Task<(int TotalCount, IReadOnlyList<ShowcaseWineryRow> Wineries)> GetShowcaseWineriesPagedAsync(
        string? q,
        WineType? wineType,
        int? grapeId,
        int? locationId,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default);

    Task<IReadOnlyList<ShowcaseWineRow>> GetShowcaseWinesAsync(
        IEnumerable<string> wineryKeys,
        string? q,
        WineType? wineType,
        int? grapeId,
        int? locationId,
        int winesPerWinery,
        CancellationToken ct = default);

    Task<CatalogFiltersResponseDto> GetCatalogFiltersAsync(CancellationToken ct = default);
}
