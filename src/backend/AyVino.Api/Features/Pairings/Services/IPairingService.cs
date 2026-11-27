using AyVino.Api.Common.Models;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Pairings.DTOs;

namespace AyVino.Api.Features.Pairings.Services;

public interface IPairingService
{
    Task<PairingResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<PairingResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? category, CancellationToken ct = default);
    Task<PagedResult<PairingResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, string? category, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<PairingResponseDto>([], 0));
    Task<PairingResponseDto> CreateAsync(CreatePairingRequestDto request, CancellationToken ct = default);
    Task<PairingResponseDto> UpdateAsync(int id, UpdatePairingRequestDto request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<IEnumerable<PairingResponseDto>> GetByWineIdAsync(int wineId, CancellationToken ct = default);
    Task AddToWineAsync(int wineId, int pairingId, Actor actor, CancellationToken ct = default);
    Task RemoveFromWineAsync(int wineId, int pairingId, Actor actor, CancellationToken ct = default);
}