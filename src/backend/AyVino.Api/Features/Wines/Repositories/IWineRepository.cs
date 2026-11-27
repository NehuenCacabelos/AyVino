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
    Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, int? currentUserId, bool isAdmin, SourceType? origin, CancellationToken ct = default) =>
        GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, currentUserId, isAdmin, ct);
    Task<int> CountAsync(int? wineryId, int? grapeId, int? yearFrom, int? yearTo, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        Task.FromResult(0);
    Task<int> CountAsync(int? wineryId, int? grapeId, int? yearFrom, int? yearTo, int? currentUserId, bool isAdmin, SourceType? origin, CancellationToken ct = default) =>
        CountAsync(wineryId, grapeId, yearFrom, yearTo, currentUserId, isAdmin, ct);

    Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, bool confirmNewLabel = false, CancellationToken ct = default);
    Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, CancellationToken ct) =>
        CreateWithFirstVintageAsync(wine, firstVintage, grapes, false, ct);
    Task<bool> UpdateAsync(Wine wine, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<WineUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default);
    Task<int> ClaimWinesAsync(int wineryId, IEnumerable<int> wineIds, CancellationToken ct = default);
    Task<Wine?> FindDuplicateCandidateAsync(string name, string winery, CancellationToken ct = default);

    Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, int? currentUserId, bool isAdmin, CancellationToken ct = default) =>
        SearchAsync(name, winery, year, wineType, pageNumber, pageSize, ct);

    Task<IEnumerable<CatalogWineItemDto>> SearchCatalogAsync(
        string? search,
        string? name,
        string? winery,
        int? year,
        WineType? wineType,
        int pageNumber,
        int pageSize,
        int? currentUserId,
        bool isAdmin,
        int? grapeId = null,
        int? stateId = null,
        int? wineryId = null,
        CancellationToken ct = default);

    Task<IEnumerable<CatalogWineItemDto>> SearchCatalogAsync(
        string? search,
        string? name,
        string? winery,
        int? year,
        WineType? wineType,
        int pageNumber,
        int pageSize,
        int? currentUserId,
        bool isAdmin,
        int? grapeId,
        int? stateId,
        int? wineryId,
        SourceType? origin,
        CancellationToken ct = default) =>
        SearchCatalogAsync(search, name, winery, year, wineType, pageNumber, pageSize, currentUserId, isAdmin, grapeId, stateId, wineryId, ct);

    Task<int> CountSearchCatalogAsync(
        string? search,
        string? name,
        string? winery,
        int? year,
        WineType? wineType,
        int? currentUserId,
        bool isAdmin,
        int? grapeId = null,
        int? stateId = null,
        int? wineryId = null,
        CancellationToken ct = default) => Task.FromResult(0);

    Task<int> CountSearchCatalogAsync(
        string? search,
        string? name,
        string? winery,
        int? year,
        WineType? wineType,
        int? currentUserId,
        bool isAdmin,
        int? grapeId,
        int? stateId,
        int? wineryId,
        SourceType? origin,
        CancellationToken ct = default) =>
        CountSearchCatalogAsync(search, name, winery, year, wineType, currentUserId, isAdmin, grapeId, stateId, wineryId, ct);

    Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, CancellationToken ct = default);
}

