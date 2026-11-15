using AyVino.Api.Features.Locations.DTOs;

namespace AyVino.Api.Features.Locations.Services;

public interface IStateService
{
    Task<StateResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<StateResponseDto>> GetAllAsync(CancellationToken ct = default);
}