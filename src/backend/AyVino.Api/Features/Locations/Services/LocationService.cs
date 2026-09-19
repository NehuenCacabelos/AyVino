using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cities.Repositories;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Repositories;

namespace AyVino.Api.Features.Locations.Services;

public class LocationService(ILocationRepository locationRepository, ICityRepository cityRepository) : ILocationService
{
    public async Task<LocationResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await locationRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Location with ID {id} not found.");
    }

    public async Task<LocationResponseDto> CreateAsync(CreateLocationRequestDto dto, CancellationToken ct = default)
    {
        var cityExists = await cityRepository.ExistsByIdAsync(dto.CityId, ct);
        if (!cityExists)
            throw new NotFoundException($"City with ID {dto.CityId} not found.");

        var location = dto.ToEntity();
        var generatedId = await locationRepository.CreateAsync(location, ct);

        return await locationRepository.GetByIdAsync(generatedId, ct)
            ?? throw new NotFoundException("Location was created but could not be retrieved.");
    }
}