using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cities.DTOs;
using AyVino.Api.Features.Cities.Enums;
using AyVino.Api.Features.Cities.Repositories;
using AyVino.Api.Features.States.Repositories;

namespace AyVino.Api.Features.Cities.Services;

public class CityService(ICityRepository cityRepository, IStateRepository stateRepository) : ICityService
{
    public async Task<CityResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var city = await cityRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"City with ID {id} not found.");

        return city.ToResponseDto();
    }

    public async Task<IEnumerable<CityResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? stateId, string? status, CancellationToken ct = default)
    {
        if (pageNumber <= 0)
            throw new ValidationException("Page number must be greater than 0.");

        if (pageSize <= 0 || pageSize > 100)
            throw new ValidationException("Page size must be between 1 and 100.");

        int? statusValue = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<CityStatus>(status, ignoreCase: true, out var parsedStatus))
                throw new ValidationException($"Invalid status: '{status}'.");
            statusValue = (int)parsedStatus;
        }

        var cities = await cityRepository.GetAllAsync(pageNumber, pageSize, stateId, statusValue, ct);
        return cities.ToResponseDtoList();
    }

    public async Task<CityResponseDto> GetOrCreateAsync(CreateCityRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ValidationException("City name is required.");

        var stateExists = await stateRepository.ExistsByIdAsync(dto.StateId, ct);
        if (!stateExists)
            throw new NotFoundException($"State with ID {dto.StateId} not found.");

        var existing = await cityRepository.GetByNameAndStateAsync(dto.Name.Trim(), dto.StateId, ct);
        if (existing is not null)
            return existing.ToResponseDto();

        var city = dto.ToEntity(dto.StateId);
        var generatedId = await cityRepository.CreateAsync(city, ct);

        return (city with { Id = generatedId }).ToResponseDto();
    }

    public async Task<CityResponseDto> UpdateStatusAsync(int id, UpdateCityStatusRequestDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<CityStatus>(dto.Status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{dto.Status}'.");

        var updated = await cityRepository.UpdateStatusAsync(id, (int)parsedStatus, ct);
        if (!updated)
            throw new NotFoundException($"City with ID {id} not found.");

        var city = await cityRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"City with ID {id} not found.");

        return city.ToResponseDto();
    }
}