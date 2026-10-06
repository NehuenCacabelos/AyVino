using AyVino.Api.Features.Pairings.DTOs;

namespace AyVino.Api.Features.Pairings.Services;

public interface IPairingService
{
    Task<PairingResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<PairingResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? category, CancellationToken ct = default);
    Task<PairingResponseDto> CreateAsync(CreatePairingRequestDto request, CancellationToken ct = default);
    Task<PairingResponseDto> UpdateAsync(int id, UpdatePairingRequestDto request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<IEnumerable<PairingResponseDto>> GetByWineIdAsync(int wineId, CancellationToken ct = default);
    Task AddToWineAsync(int wineId, int pairingId, CancellationToken ct = default);
    Task RemoveFromWineAsync(int wineId, int pairingId, CancellationToken ct = default);
}