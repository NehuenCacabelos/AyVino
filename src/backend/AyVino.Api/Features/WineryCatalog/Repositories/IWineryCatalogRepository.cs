using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Models;

namespace AyVino.Api.Features.WineryCatalog.Repositories;

public interface IWineryCatalogRepository
{
    Task<WineryCatalogOwnerWinery?> GetWineryByUserIdAsync(int userId, CancellationToken ct = default);
    Task<WineryCatalogTotalsRow> GetTotalsByWineryIdAsync(int wineryId, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogWineRow>> GetWinesByWineryIdAsync(int wineryId, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogVintageRow>> GetVintagesByWineIdsAsync(IEnumerable<int> wineIds, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogGrapeRow>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default);

    Task<WineryPublicProfileRow?> GetWineryPublicProfileRowAsync(int wineryId, CancellationToken ct = default);
    Task<int> GetFollowersCountAsync(int wineryId, CancellationToken ct = default);
    Task<bool> IsFollowedByUserAsync(int wineryId, int userId, CancellationToken ct = default);
    Task<WineryPublicRatingsAndTotalsRow> GetPublicRatingsAndTotalsAsync(int wineryId, bool isPreview, CancellationToken ct = default);
    Task<WineryPublicCatalogFiltersDto> GetPublicCatalogFiltersAsync(int wineryId, bool isPreview, CancellationToken ct = default);
    Task<(int TotalCount, IReadOnlyList<WineryCatalogWineRow> Wines)> GetPublicCatalogWinesPagedAsync(int wineryId, bool isPreview, WineryPublicCatalogQueryParams query, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogVintageRow>> GetPublicVintagesByWineIdsAsync(IEnumerable<int> wineIds, bool isPreview, CancellationToken ct = default);
}
