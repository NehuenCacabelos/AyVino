using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.DTOs;

public static class LocationMappingExtensions
{
    public static Location ToEntity(this CreateLocationRequestDto dto)
        => new() { CityId = dto.CityId };
}