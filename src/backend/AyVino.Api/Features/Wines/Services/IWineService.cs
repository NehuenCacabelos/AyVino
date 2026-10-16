using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineService
{
    Task<WineResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, CancellationToken ct = default);
    Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, Actor actor, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, Actor actor, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> SearchAsync(string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, CancellationToken ct = default);
}