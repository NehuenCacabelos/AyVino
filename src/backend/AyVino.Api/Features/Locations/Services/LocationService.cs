using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Repositories;

namespace AyVino.Api.Features.Locations.Services;

public class LocationService(ILocationRepository locationRepository, ICityRepository cityRepository) : ILocationService
{
    public async Task<LocationResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var location = await locationRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Location with ID {id} not found.");
        return location.ToResponseDto();
    }

    public async Task<LocationResponseDto> CreateAsync(CreateLocationRequestDto dto, CancellationToken ct = default)
    {
        var cityExists = await cityRepository.ExistsByIdAsync(dto.CityId, ct);
        if (!cityExists)
            throw new NotFoundException($"City with ID {dto.CityId} not found.");

        var location = dto.ToEntity();
        var generatedId = await locationRepository.CreateAsync(location, ct);

        var created = await locationRepository.GetByIdAsync(generatedId, ct)
            ?? throw new NotFoundException("Location was created but could not be retrieved.");
        return created.ToResponseDto();
    }

    public async Task<IEnumerable<LocationResponseDto>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default)
    {
        if (pageNumber <= 0)
            throw new ValidationException("pageNumber debe ser mayor a 0.");

        if (pageSize <= 0 || pageSize > 100)
            throw new ValidationException("pageSize debe estar entre 1 y 100.");

        var locations = await locationRepository.GetAllAsync(pageNumber, pageSize, ct);
        return locations.Select(l => l.ToResponseDto());
    }
}