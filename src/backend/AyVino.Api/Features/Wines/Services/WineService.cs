using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Wines.Services;

public class WineService(
    IWineRepository wineRepository,
    IWineryRepository wineryRepository,
    ILocationRepository locationRepository,
    IGrapeRepository grapeRepository) : IWineService
{
    public async Task<WineResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Wine with ID {id} not found.");
        var grapes = await wineRepository.GetGrapesByWineIdAsync(id, ct);
        return wine.ToResponseDto(grapes);
    }

    public async Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("Page number must be greater than 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("Page size must be between 1 and 100.");
        if (yearFrom.HasValue && yearTo.HasValue && yearFrom > yearTo)
            throw new ValidationException("'yearFrom' cannot be greater than 'yearTo'.");

        var wines = await wineRepository.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, ct);

        // N+1 a propósito: seguimos el mismo criterio simple que el resto del proyecto (sin
        // multi-mapping de Dapper todavía) y el pageSize está topeado en 100, así que no duele.
        var result = new List<WineResponseDto>();
        foreach (var wine in wines)
        {
            var grapes = await wineRepository.GetGrapesByWineIdAsync(wine.Id, ct);
            result.Add(wine.ToResponseDto(grapes));
        }
        return result;
    }

    public async Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, CancellationToken ct = default)
    {
        var wineType = await ValidateAndParseAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var wine = await wineRepository.CreateAsync(dto, wineType, grapes, ct);
        return wine.ToResponseDto(grapes);
    }

    public async Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, CancellationToken ct = default)
    {
        var exists = await wineRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Wine with ID {id} not found.");

        var wineType = await ValidateAndParseAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var updated = await wineRepository.UpdateAsync(id, dto, wineType, grapes, ct);
        if (!updated) throw new NotFoundException($"Wine with ID {id} not found.");

        return await GetByIdAsync(id, ct);
    }

    public async Task<WineResponseDto> ChangeStatusAsync(int id, string status, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ApprovalStatus>(status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{status}'.");

        var exists = await wineRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Wine with ID {id} not found.");

        var updated = await wineRepository.UpdateStatusAsync(id, (int)parsedStatus, ct);
        if (!updated) throw new NotFoundException($"Wine with ID {id} not found.");

        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await wineRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Wine with ID {id} not found.");
    }

    private async Task<WineType> ValidateAndParseAsync(string name, string wineType, int? wineryId, int? locationId, List<WineGrapeRequestDto>? grapes, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ValidationException("The wine name is required.");
        if (name.Length > 150)
            throw new ValidationException("The wine name cannot exceed 150 characters.");

        if (!Enum.TryParse<WineType>(wineType, ignoreCase: true, out var parsedType))
            throw new ValidationException($"Invalid wine type: '{wineType}'.");

        if (wineryId.HasValue && !await wineryRepository.ExistsByIdAsync(wineryId.Value, ct))
            throw new ValidationException($"Winery with ID {wineryId} does not exist.");

        if (locationId.HasValue && !await locationRepository.ExistsByIdAsync(locationId.Value, ct))
            throw new ValidationException($"Location with ID {locationId} does not exist.");

        if (grapes is { Count: > 0 })
        {
            if (grapes.Select(g => g.GrapeId).Distinct().Count() != grapes.Count)
                throw new ValidationException("The same grape cannot be listed twice for a wine.");

            foreach (var grape in grapes)
            {
                if (grape.Percentage is <= 0 or > 100)
                    throw new ValidationException("Each grape's percentage must be between 0 (exclusive) and 100.");

                if (!await grapeRepository.ExistsByIdAsync(grape.GrapeId, ct))
                    throw new ValidationException($"Grape with ID {grape.GrapeId} does not exist.");
            }

            // Esta es la regla de negocio de 2+ entidades que pide la consigna: el corte no puede declarar más del 100%.
            var totalPercentage = grapes.Sum(g => g.Percentage ?? 0);
            if (totalPercentage > 100)
                throw new ValidationException("The sum of the grape percentages cannot exceed 100%.");
        }

        return parsedType;
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}