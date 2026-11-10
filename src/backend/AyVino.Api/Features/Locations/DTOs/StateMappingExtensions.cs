using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.DTOs;

public static class StateMappingExtensions
{
    public static StateResponseDto ToResponseDto(this State state)
        => new(state.Id, state.Name);

    public static IEnumerable<StateResponseDto> ToResponseDtoList(this IEnumerable<State> states)
        => states.Select(s => s.ToResponseDto());
}