using AyVino.Api.Features.States.DTOs;

namespace AyVino.Api.Features.States.Services;

public interface IStateService
{
    Task<StateResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<StateResponseDto>> GetAllAsync(CancellationToken ct = default);
}