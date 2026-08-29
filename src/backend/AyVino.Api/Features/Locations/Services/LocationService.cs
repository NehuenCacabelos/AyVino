using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Repositories;

namespace AyVino.Api.Features.Locations.Services;

public class LocationService(ILocationRepository locationRepository) : ILocationService
{
    public async Task<LocationResponseDto> CreateAsync(CreateLocationRequestDto dto, CancellationToken ct = default)
    {
        ValidateRequest(dto.Country, dto.State, dto.City);

        var location = dto.ToEntity();
        var generatedId = await locationRepository.CreateAsync(location, ct);
        var created = location with { Id = generatedId };

        return created.ToResponseDto();
    }

    public async Task<LocationResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Location with ID {id} not found.");
        }

        var location = await locationRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Location with ID {id} not found.");

        return location.ToResponseDto();
    }

    public async Task<IEnumerable<LocationResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? country, CancellationToken ct = default)
    {
        if (pageNumber <= 0)
        {
            throw new ValidationException("Page number must be greater than 0.");
        }

        if (pageSize <= 0 || pageSize > 100)
        {
            throw new ValidationException("Page size must be between 1 and 100.");
        }

        var locations = await locationRepository.GetAllAsync(pageNumber, pageSize, country?.Trim(), ct);
        return locations.ToResponseDtoList();
    }

    public async Task<LocationResponseDto> UpdateAsync(int id, UpdateLocationRequestDto dto, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Location with ID {id} not found.");
        }

        ValidateRequest(dto.Country, dto.State, dto.City);

        var existing = await locationRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Location with ID {id} not found.");

        var updated = existing with
        {
            Country = dto.Country.Trim(),
            State = dto.State?.Trim(),
            City = dto.City?.Trim()
        };

        var wasUpdated = await locationRepository.UpdateAsync(updated, ct);
        if (!wasUpdated)
        {
            throw new NotFoundException($"Location with ID {id} not found.");
        }

        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Location with ID {id} not found.");
        }

        var deleted = await locationRepository.DeleteAsync(id, ct);
        if (!deleted)
        {
            throw new NotFoundException($"Location with ID {id} not found.");
        }
    }

    private static void ValidateRequest(string country, string? state, string? city)
    {
        if (string.IsNullOrWhiteSpace(country))
        {
            throw new ValidationException("Country is required.");
        }

        if (country.Trim().Length > 100)
        {
            throw new ValidationException("Country cannot exceed 100 characters.");
        }
    }
}