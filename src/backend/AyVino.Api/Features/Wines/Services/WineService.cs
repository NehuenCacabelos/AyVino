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
        return wine.ToResponseDto();
    }

    public async Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("Page number must be greater than 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("Page size must be between 1 and 100.");
        if (yearFrom.HasValue && yearTo.HasValue && yearFrom > yearTo)
            throw new ValidationException("'yearFrom' cannot be greater than 'yearTo'.");

        var wines = await wineRepository.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, ct);
        return wines.Select(w => w.ToResponseDto());
    }

    public async Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, CancellationToken ct = default)
    {
        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);
        await ValidateGrapesAsync(dto.FirstVintage.Grapes, ct);
        var grapes = ToWineGrapes(dto.FirstVintage.Grapes);
        var sourceType = dto.WineryId.HasValue ? SourceType.Official : SourceType.Community;

        var wine = await wineRepository.CreateWithFirstVintageAsync(dto, wineType, sourceType, dto.FirstVintage, grapes, ct);
        return wine.ToResponseDto();
    }

    public async Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, CancellationToken ct = default)
    {
        var exists = await wineRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Wine with ID {id} not found.");

        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);
        var updated = await wineRepository.UpdateAsync(id, dto, wineType, ct);
        if (!updated) throw new NotFoundException($"Wine with ID {id} not found.");

        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await wineRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Wine with ID {id} not found.");
    }

    public async Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, CancellationToken ct = default)
    {
        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Winery with ID {wineryId} not found.");

        var candidates = await wineRepository.GetUnclaimedByNameLikeAsync(winery.Name, ct);
        return candidates.Select(w => w.ToResponseDto());
    }

    public async Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, CancellationToken ct = default)
    {
        var exists = await wineryRepository.ExistsByIdAsync(wineryId, ct);
        if (!exists) throw new NotFoundException($"Winery with ID {wineryId} not found.");

        if (wineIds is not { Count: > 0 })
            throw new ValidationException("You must provide at least one wine ID to claim.");

        var claimedCount = await wineRepository.ClaimWinesAsync(wineryId, wineIds.Distinct(), ct);
        if (claimedCount == 0)
            throw new ValidationException("None of the provided wine IDs were valid, unclaimed wines.");

        var claimed = new List<WineResponseDto>();
        foreach (var wineId in wineIds.Distinct())
        {
            var wine = await wineRepository.GetByIdAsync(wineId, ct);
            if (wine is not null && wine.WineryId == wineryId)
                claimed.Add(wine.ToResponseDto());
        }
        return claimed;
    }

    private async Task<WineType> ValidateLabelAsync(string name, string wineType, int? wineryId, int? locationId, CancellationToken ct)
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

        return parsedType;
    }

    // Duplicado a propósito con WineVintageService.ValidateGrapesAsync (mismas ~10 líneas):
    // es la única validación de uvas que necesita este service, no vale la pena acoplar
    // los dos services por esto. Si crece, se extrae a un helper compartido.
    private async Task ValidateGrapesAsync(List<WineGrapeRequestDto>? grapes, CancellationToken ct)
    {
        if (grapes is not { Count: > 0 }) return;

        if (grapes.Select(g => g.GrapeId).Distinct().Count() != grapes.Count)
            throw new ValidationException("The same grape cannot be listed twice for a vintage.");

        foreach (var grape in grapes)
        {
            if (grape.Percentage is <= 0 or > 100)
                throw new ValidationException("Each grape's percentage must be between 0 (exclusive) and 100.");
            if (!await grapeRepository.ExistsByIdAsync(grape.GrapeId, ct))
                throw new ValidationException($"Grape with ID {grape.GrapeId} does not exist.");
        }

        var total = grapes.Sum(g => g.Percentage ?? 0);
        if (total > 100)
            throw new ValidationException("The sum of the grape percentages cannot exceed 100%.");
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}