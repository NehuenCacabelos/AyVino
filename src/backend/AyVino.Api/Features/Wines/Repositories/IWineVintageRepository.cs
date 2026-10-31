using System.Data;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.Repositories;

public interface IWineVintageRepository
{
    Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<WineVintage?> GetByIdAsync(int id, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        GetByIdAsync(id, ct);

    Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default);
    Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        GetAllByWineIdAsync(wineId, ct);

    Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default);
    Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default);
    Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateImageIdAsync(int vintageId, Guid? imageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateImageIdAsync(int vintageId, Guid? imageId, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<WineVintageUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default);
    Task<int> GetDistinctUserCountAsync(int vintageId, CancellationToken ct = default) => Task.FromResult(0);
    Task<IReadOnlyDictionary<int, int>> GetDistinctUserCountsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default) => Task.FromResult<IReadOnlyDictionary<int, int>>(new Dictionary<int, int>());
    Task<bool> IsUserParticipantAsync(int vintageId, int userId, CancellationToken ct = default) => Task.FromResult(false);
    Task<HashSet<int>> GetParticipantVintageIdsAsync(int userId, IEnumerable<int> vintageIds, CancellationToken ct = default) => Task.FromResult(new HashSet<int>());
    Task<IEnumerable<AdminWineVintageListRow>> GetPagedForAdminAsync(int pageNumber, int pageSize, int? status, CancellationToken ct = default) =>
        Task.FromResult(Enumerable.Empty<AdminWineVintageListRow>());
}
