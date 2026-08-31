using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.DTOs;

public static class LocationMappingExtensions
{
    public static Location ToEntity(this CreateLocationRequestDto dto)
    {
        return new Location
        {
            Country = dto.Country.Trim(),
            State = dto.State?.Trim(),
            City = dto.City?.Trim()
        };
    }

    public static LocationResponseDto ToResponseDto(this Location location)
    {
        return new LocationResponseDto(
            Id: location.Id,
            Country: location.Country,
            State: location.State,
            City: location.City
        );
    }

    public static IEnumerable<LocationResponseDto> ToResponseDtoList(this IEnumerable<Location> locations)
    {
        return locations.Select(l => l.ToResponseDto());
    }
}