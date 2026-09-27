using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineService
{
    Task<WineResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, CancellationToken ct = default);
    Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, CancellationToken ct = default);
    Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, CancellationToken ct = default);
    Task<WineResponseDto> ChangeStatusAsync(int id, string status, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

    // Pieza B
    Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, CancellationToken ct = default);
    Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, CancellationToken ct = default);
}