using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.States.DTOs;
using AyVino.Api.Features.States.Repositories;

namespace AyVino.Api.Features.States.Services;

public class StateService(IStateRepository stateRepository) : IStateService
{
    public async Task<StateResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var state = await stateRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"State with ID {id} not found.");

        return state.ToResponseDto();
    }

    public async Task<IEnumerable<StateResponseDto>> GetAllAsync(CancellationToken ct = default)
    {
        var states = await stateRepository.GetAllAsync(ct);
        return states.ToResponseDtoList();
    }
}