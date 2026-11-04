using System.Data;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.Repositories;

public interface IWineRepository
{
    Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Wine?> GetVisibleByIdAsync(int id, int? currentUserId, bool isAdmin, CancellationToken ct = default);

    Task<IEnumerable<Wine>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);

    Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default);
    Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, ct);

    Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateAsync(Wine wine, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<WineUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default);
    Task<WineUsageCounts> GetUsageCountsAsync(int id, int? excludeUserId, CancellationToken ct = default) => GetUsageCountsAsync(id, ct);
    Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default);
    Task<IEnumerable<Wine>> GetUnclaimedCommunityWinesAsync(CancellationToken ct = default) => GetUnclaimedByNameLikeAsync("", ct);
    Task<int> ClaimWinesAsync(int wineryId, IEnumerable<int> wineIds, CancellationToken ct = default);

    Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        SearchAsync(name, winery, year, wineType, pageNumber, pageSize, ct);

    Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, CancellationToken ct = default);

    Task<Wine?> GetByLabelKeyAsync(string labelKey, CancellationToken ct = default) => Task.FromResult<Wine?>(null);
    Task<int> UpdateLabelKeysForWineryAsync(int wineryId, string newWineryName, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) => Task.FromResult(0);
    Task<int> UpdateLabelKeysForWineryAsync(int wineryId, string newWineryName, CancellationToken ct = default) => Task.FromResult(0);
}
