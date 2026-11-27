using AyVino.Api.Common.Models;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineService
{
    Task<WineResponseDto> GetByIdAsync(int id, Actor? actor = null, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, Actor? actor = null, CancellationToken ct = default);
    Task<PagedResult<WineResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, Actor? actor = null, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<WineResponseDto>([], 0));
    Task<PagedResult<WineResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, string? origin, Actor? actor = null, CancellationToken ct = default) =>
        GetAllPagedAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, actor, ct);
    Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task DeleteAsync(int id, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> SearchAsync(string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, CancellationToken ct = default);
    Task<IEnumerable<CatalogWineItemDto>> SearchCatalogAsync(string? search, string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, int? grapeId = null, int? stateId = null, int? wineryId = null, CancellationToken ct = default);
    Task<PagedResult<CatalogWineItemDto>> SearchCatalogPagedAsync(string? search, string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, int? grapeId = null, int? stateId = null, int? wineryId = null, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<CatalogWineItemDto>([], 0));
    Task<PagedResult<CatalogWineItemDto>> SearchCatalogPagedAsync(string? search, string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor, int? grapeId, int? stateId, int? wineryId, string? origin, CancellationToken ct = default) =>
        SearchCatalogPagedAsync(search, name, winery, year, wineType, pageNumber, pageSize, actor, grapeId, stateId, wineryId, ct);
    Task<WineDuplicateCheckResponseDto> CheckDuplicateAsync(string? name, string? winery, CancellationToken ct = default);
    Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, Actor actor, CancellationToken ct = default);
}
