using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Rules;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Wines.Services;

public class WineService(
    IWineRepository wineRepository,
    IWineryRepository wineryRepository,
    ILocationRepository locationRepository,
    IGrapeRepository grapeRepository,
    IImageStorage? imageStorage = null) : IWineService
{
    public async Task<WineResponseDto> GetByIdAsync(int id, Actor? actor = null, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Wine with ID {id} not found.");

        if (wine.WineryId is int wineryId)
        {
            var winery = await wineryRepository.GetByIdAsync(wineryId, ct);
            if (winery != null && winery.Status != WineryStatus.Approved)
            {
                var isOwnerOrAdmin = actor?.IsAdmin == true || (actor != null && WineryAccessRules.IsOwner(winery, actor));
                if (!isOwnerOrAdmin)
                {
                    throw new NotFoundException($"Wine with ID {id} not found.");
                }
            }
        }

        return wine.ToResponseDto();
    }

    public async Task<IEnumerable<WineResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, Actor? actor = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
        if (yearFrom.HasValue && yearTo.HasValue && yearFrom > yearTo)
            throw new ValidationException("'yearFrom' cannot be greater than 'yearTo'.");

        var wines = await wineRepository.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, actor?.UserId, actor?.IsAdmin == true, ct);
        return wines.Select(w => w.ToResponseDto());
    }

    public async Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);

        if (dto.WineryId.HasValue && !actor.IsAdmin)
        {
            var winery = await wineryRepository.GetByIdAsync(dto.WineryId.Value, ct)
                ?? throw new ValidationException($"Winery with ID {dto.WineryId} does not exist.");

            if (!WineryAccessRules.IsOwner(winery, actor))
                throw new ForbiddenException("Solo el dueño de la bodega puede publicar vinos oficiales a su nombre.");

            if (!WineryAccessRules.CanPublish(winery, actor))
                throw new ForbiddenException("La bodega debe estar aprobada o pendiente para publicar vinos oficiales.");
        }

        if (!string.IsNullOrWhiteSpace(dto.FirstVintage.ImageUrl))
        {
            if (imageStorage != null && !imageStorage.IsUrlFromStorage(dto.FirstVintage.ImageUrl))
                throw new ValidationException("La URL de la imagen debe pertenecer al almacenamiento oficial del sistema.");
        }

        await ValidateGrapesAsync(dto.FirstVintage.Grapes, ct);
        var grapes = ToWineGrapes(dto.FirstVintage.Grapes);
        var sourceType = dto.WineryId.HasValue ? SourceType.Official : SourceType.Community;

        var wineEntity = dto.ToEntity(wineType, sourceType);
        var firstVintageEntity = dto.FirstVintage.ToEntity(actor.UserId);

        var wine = await wineRepository.CreateWithFirstVintageAsync(wineEntity, firstVintageEntity, grapes, ct);
        return wine.ToResponseDto();
    }

    public async Task<WineResponseDto> UpdateAsync(int id, UpdateWineRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        var existing = await wineRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Wine with ID {id} not found.");

        if (!actor.IsAdmin)
        {
            if (existing.WineryId is null)
                throw new ForbiddenException("Solo un administrador puede editar vinos comunitarios.");

            var winery = await wineryRepository.GetByIdAsync(existing.WineryId.Value, ct);
            if (!WineryAccessRules.IsOwner(winery, actor))
                throw new ForbiddenException("No tenés permiso para editar este vino.");

            if (dto.WineryId != existing.WineryId)
                throw new ForbiddenException("Solo un administrador puede cambiar la bodega de un vino.");
        }

        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);
        var sourceType = dto.WineryId.HasValue ? SourceType.Official : SourceType.Community;
        var wineEntity = dto.ToEntity(id, wineType, sourceType);
        var updated = await wineRepository.UpdateAsync(wineEntity, ct);
        if (!updated) throw new NotFoundException($"Wine with ID {id} not found.");

        return await GetByIdAsync(id, actor, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await wineRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Wine with ID {id} not found.");
    }

    public async Task<IEnumerable<WineResponseDto>> GetClaimCandidatesAsync(int wineryId, Actor actor, CancellationToken ct = default)
    {
        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Winery with ID {wineryId} not found.");

        if (!actor.IsAdmin)
        {
            if (!WineryAccessRules.IsOwner(winery, actor))
                throw new ForbiddenException("Solo el dueño de la bodega puede reclamar vinos.");
            if (!WineryAccessRules.CanClaim(winery, actor))
                throw new ForbiddenException("La bodega debe estar aprobada para reclamar vinos.");
        }

        var candidates = await wineRepository.GetUnclaimedByNameLikeAsync(winery.Name, ct);
        return candidates.Select(w => w.ToResponseDto());
    }

    public async Task<IEnumerable<WineResponseDto>> ClaimWinesAsync(int wineryId, List<int> wineIds, Actor actor, CancellationToken ct = default)
    {
        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Winery with ID {wineryId} not found.");

        if (!actor.IsAdmin)
        {
            if (!WineryAccessRules.IsOwner(winery, actor))
                throw new ForbiddenException("Solo el dueño de la bodega puede reclamar vinos.");
            if (!WineryAccessRules.CanClaim(winery, actor))
                throw new ForbiddenException("La bodega debe estar aprobada para reclamar vinos.");
        }

        if (wineIds is not { Count: > 0 })
            throw new ValidationException("You must provide at least one wine ID to claim.");

        var distinctIds = wineIds.Distinct().ToList();
        var claimedCount = await wineRepository.ClaimWinesAsync(wineryId, distinctIds, ct);
        if (claimedCount == 0)
            throw new ValidationException("None of the provided wine IDs were valid, unclaimed wines.");

        var claimedWines = await wineRepository.GetByIdsAsync(distinctIds, ct);
        return claimedWines
            .Where(w => w.WineryId == wineryId)
            .Select(w => w.ToResponseDto())
            .ToList();
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

    public async Task<IEnumerable<WineResponseDto>> SearchAsync(string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(winery) && year is null && string.IsNullOrWhiteSpace(wineType))
            throw new ValidationException("At least one search criterion (name, winery, year, or type) is required.");

        WineType? parsedType = null;
        if (!string.IsNullOrWhiteSpace(wineType))
        {
            if (!Enum.TryParse<WineType>(wineType, ignoreCase: true, out var parsed))
                throw new ValidationException($"Invalid wine type: '{wineType}'.");
            parsedType = parsed;
        }

        var wines = await wineRepository.SearchAsync(name, winery, year, parsedType, pageNumber, pageSize, actor?.UserId, actor?.IsAdmin == true, ct);
        return wines.Select(w => w.ToResponseDto());
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}
