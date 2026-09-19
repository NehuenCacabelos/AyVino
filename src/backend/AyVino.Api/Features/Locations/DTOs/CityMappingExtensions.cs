using AyVino.Api.Features.Cities.Models;

namespace AyVino.Api.Features.Cities.DTOs;

public static class CityMappingExtensions
{
    public static City ToEntity(this CreateCityRequestDto dto, int stateId)
    {
        return new City
        {
            Name = dto.Name.Trim(),
            StateId = stateId
        };
    }

    public static CityResponseDto ToResponseDto(this City city)
        => new(city.Id, city.Name, city.StateId, city.Status.ToString());

    public static IEnumerable<CityResponseDto> ToResponseDtoList(this IEnumerable<City> cities)
        => cities.Select(c => c.ToResponseDto());
}