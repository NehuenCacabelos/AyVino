using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Repositories;

namespace AyVino.Api.Features.Locations.Services;

public class LocationService(
    ILocationRepository locationRepository,
    ICityRepository cityRepository,
    IGeorefClient georefClient) : ILocationService
{
    public LocationService(ILocationRepository locationRepository, ICityRepository cityRepository)
        : this(locationRepository, cityRepository, null!)
    {
    }
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

    public async Task<ResolvedLocationResponseDto> ResolveCoordinatesAsync(decimal latitude, decimal longitude, CancellationToken ct = default)
    {
        var georef = await georefClient.ResolveLocationAsync(latitude, longitude, ct);

        var city = await cityRepository.GetByGeorefIdAsync(georef.DepartmentId, ct)
            ?? throw new NotFoundException($"No se encontró la región interna para el departamento con código Georef {georef.DepartmentId}.");

        var location = await locationRepository.GetByCityIdAsync(city.Id, ct)
            ?? throw new NotFoundException($"No se encontró el registro de ubicación asociado al departamento {city.Name}.");

        return new ResolvedLocationResponseDto(
            LocationId: location.Id,
            StateId: location.StateId,
            StateName: location.StateName,
            RegionId: city.Id,
            RegionName: city.Name,
            MunicipalityName: georef.MunicipalityName);
    }
}
