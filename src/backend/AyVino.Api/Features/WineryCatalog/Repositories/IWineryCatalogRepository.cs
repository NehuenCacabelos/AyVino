using AyVino.Api.Features.WineryCatalog.Models;

namespace AyVino.Api.Features.WineryCatalog.Repositories;

public interface IWineryCatalogRepository
{
    Task<WineryCatalogOwnerWinery?> GetWineryByUserIdAsync(int userId, CancellationToken ct = default);
    Task<WineryCatalogTotalsRow> GetTotalsByWineryIdAsync(int wineryId, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogWineRow>> GetWinesByWineryIdAsync(int wineryId, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogVintageRow>> GetVintagesByWineIdsAsync(IEnumerable<int> wineIds, CancellationToken ct = default);
    Task<IReadOnlyList<WineryCatalogGrapeRow>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default);
}
