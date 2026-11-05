using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineService
{
    Task<WineResponseDto> GetByIdAsync(int id, Actor? actor = null, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, Actor? actor = null, CancellationToken ct = default);
    Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> SearchAsync(string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, CancellationToken ct = default);
    Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, Actor actor, CancellationToken ct = default);
}
