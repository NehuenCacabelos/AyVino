using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Rules;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Utils;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Wines.Services;

public class WineService(
    IWineRepository wineRepository,
    IWineryRepository wineryRepository,
    ILocationRepository locationRepository,
    IGrapeRepository grapeRepository,
    IWineVintageRepository? vintageRepository = null,
    IActivityRecorder? activityRecorder = null,
    ILogger<WineService>? logger = null) : IWineService
{
    public async Task<WineResponseDto> GetByIdAsync(int id, Actor? actor = null, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetVisibleByIdAsync(id, actor?.UserId, actor?.IsAdmin == true, ct)
            ?? throw new NotFoundException($"Wine with ID {id} not found.");

        return wine.ToResponseDto();
    }

    public async Task<IEnumerable<WineListItemDto>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, Actor? actor = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
        if (yearFrom.HasValue && yearTo.HasValue && yearFrom > yearTo)
            throw new ValidationException("'yearFrom' cannot be greater than 'yearTo'.");

        var wines = await wineRepository.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, actor?.UserId, actor?.IsAdmin == true, ct);
        return wines.Select(w => w.ToListItemDto());
    }

    public async Task<WineResponseDto> CreateAsync(CreateWineRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        string wineryName;
        if (dto.WineryId.HasValue)
        {
            var winery = await wineryRepository.GetByIdAsync(dto.WineryId.Value, ct);
            if (!actor.IsAdmin)
            {
                if (winery is null)
                    throw new ValidationException($"Winery with ID {dto.WineryId} does not exist.");

                if (!WineryAccessRules.IsOwner(winery, actor))
                    throw new ForbiddenException("Solo el dueño de la bodega puede publicar vinos oficiales a su nombre.");

                if (!WineryAccessRules.CanPublish(winery, actor))
                    throw new ForbiddenException("La bodega debe estar aprobada o pendiente para publicar vinos oficiales.");
            }
            wineryName = winery?.Name ?? dto.WineryNameText?.Trim() ?? string.Empty;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.WineryNameText) || dto.WineryNameText.Trim().Length == 0)
                throw new ValidationException("El nombre de la bodega es obligatorio cuando no se selecciona una bodega registrada.");
            if (dto.WineryNameText.Trim().Length > 150)
                throw new ValidationException("El nombre de la bodega no puede superar los 150 caracteres.");
            wineryName = dto.WineryNameText.Trim();
        }

        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);

        var labelKey = WineLabelNormalizer.BuildLabelKey(dto.Name, wineryName, wineType);
        var existingWine = await wineRepository.GetByLabelKeyAsync(labelKey, ct);
        if (existingWine is not null)
        {
            int? existingVintageId = null;
            if (vintageRepository is not null)
            {
                var vintages = await vintageRepository.GetAllByWineIdAsync(existingWine.Id, ct);
                existingVintageId = vintages.FirstOrDefault(v => v.Year == dto.FirstVintage.Year)?.Id;
            }

            var extensions = new Dictionary<string, object?>
            {
                ["existingWineId"] = existingWine.Id,
                ["existingVintageId"] = existingVintageId
            };
            throw new ConflictException("Ya existe un vino con características idénticas.", extensions);
        }

        await ValidateGrapesAsync(dto.FirstVintage.Grapes, ct);
        var grapes = ToWineGrapes(dto.FirstVintage.Grapes);
        var sourceType = dto.WineryId.HasValue ? SourceType.Official : SourceType.Community;

        var wineEntity = dto.ToEntity(wineType, sourceType, labelKey);
        var firstVintageEntity = dto.FirstVintage.ToEntity(actor.UserId);

        var wine = await wineRepository.CreateWithFirstVintageAsync(wineEntity, firstVintageEntity, grapes, ct);

        if (activityRecorder != null)
        {
            try
            {
                int? firstVintageId = null;
                if (vintageRepository != null)
                {
                    var vintages = await vintageRepository.GetAllByWineIdAsync(wine.Id, ct);
                    firstVintageId = vintages.FirstOrDefault(v => v.Year == dto.FirstVintage.Year)?.Id;
                }
                await activityRecorder.RecordAsync(actor.UserId, ActivityType.WineContributed, wine.Id, firstVintageId, ct);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Error al registrar actividad WineContributed para usuario {UserId} y vino {WineId}", actor.UserId, wine.Id);
            }
        }

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

            if (!WineryAccessRules.CanPublish(winery, actor))
                throw new ForbiddenException("La bodega debe estar aprobada o pendiente para editar vinos.");

            if (dto.WineryId != existing.WineryId)
                throw new ForbiddenException("Solo un administrador puede cambiar la bodega de un vino.");
        }

        string wineryName;
        if (dto.WineryId.HasValue)
        {
            var winery = await wineryRepository.GetByIdAsync(dto.WineryId.Value, ct);
            wineryName = winery?.Name ?? dto.WineryNameText?.Trim() ?? string.Empty;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.WineryNameText) || dto.WineryNameText.Trim().Length == 0)
                throw new ValidationException("El nombre de la bodega es obligatorio cuando no se selecciona una bodega registrada.");
            if (dto.WineryNameText.Trim().Length > 150)
                throw new ValidationException("El nombre de la bodega no puede superar los 150 caracteres.");
            wineryName = dto.WineryNameText.Trim();
        }

        var wineType = await ValidateLabelAsync(dto.Name, dto.WineType, dto.WineryId, dto.LocationId, ct);
        var labelKey = WineLabelNormalizer.BuildLabelKey(dto.Name, wineryName, wineType);
        var sourceType = dto.WineryId.HasValue ? SourceType.Official : SourceType.Community;
        var wineEntity = dto.ToEntity(id, wineType, sourceType, labelKey);
        var updated = await wineRepository.UpdateAsync(wineEntity, ct);
        if (!updated) throw new NotFoundException($"Wine with ID {id} not found.");

        return await GetByIdAsync(id, actor, ct);
    }

    public async Task<WineMatchResultDto> MatchAsync(string? name, string? wineryName, string? wineType, int? year, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ValidationException("El nombre del vino es obligatorio.");
        if (string.IsNullOrWhiteSpace(wineryName))
            throw new ValidationException("El nombre de la bodega es obligatorio.");
        if (string.IsNullOrWhiteSpace(wineType) || !Enum.TryParse<WineType>(wineType, ignoreCase: true, out var parsedType))
            throw new ValidationException($"Invalid wine type: '{wineType}'.");

        var labelKey = WineLabelNormalizer.BuildLabelKey(name, wineryName, parsedType);
        var wine = await wineRepository.GetByLabelKeyAsync(labelKey, ct);
        if (wine is null)
        {
            return new WineMatchResultDto(null, null);
        }

        string wineryDisplayName = wine.WineryNameText ?? string.Empty;
        if (wine.WineryId.HasValue)
        {
            var wineryEntity = await wineryRepository.GetByIdAsync(wine.WineryId.Value, ct);
            if (wineryEntity is not null)
            {
                wineryDisplayName = wineryEntity.Name;
            }
        }

        var matchedWine = new MatchedWineDto(
            wine.Id,
            wine.Name,
            wineryDisplayName,
            wine.WineType.ToString());

        MatchedVintageDto? matchedVintage = null;
        if (vintageRepository is not null)
        {
            var vintages = await vintageRepository.GetAllByWineIdAsync(wine.Id, ct);
            var vintage = vintages.FirstOrDefault(v => v.Year == year);
            if (vintage is not null)
            {
                matchedVintage = new MatchedVintageDto(
                    vintage.Id,
                    vintage.Year,
                    vintage.ApprovalStatus.ToString());
            }
        }

        return new WineMatchResultDto(matchedWine, matchedVintage);
    }

    public Task DeleteAsync(int id, CancellationToken ct = default) =>
        DeleteAsync(id, null, ct);

    public async Task DeleteAsync(int id, int? currentUserId, CancellationToken ct = default)
    {
        var exists = await wineRepository.ExistsByIdAsync(id, ct);
        if (!exists)
            throw new NotFoundException($"Wine with ID {id} not found.");

        var usage = currentUserId.HasValue
            ? await wineRepository.GetUsageCountsAsync(id, currentUserId.Value, ct)
            : await wineRepository.GetUsageCountsAsync(id, ct);
        if (usage.HasBlockingUsage)
        {
            if (usage.HasUserHistory && usage.HasDuplicates)
            {
                throw new ConflictException(
                    $"No se puede eliminar el vino porque tiene historial de otros usuarios (reseñas: {usage.ReviewCount}, marcas: {usage.UserWineCount}, cava: {usage.CellarItemCount}, fotos: {usage.OtherUserImagesCount}, actividades: {usage.OtherUserActivitiesCount}) y vinos duplicados asociados ({usage.DuplicateWinesCount}). Si es un duplicado, usá la fusión o rechazá sus cosechas para preservar el historial.");
            }

            if (usage.HasUserHistory)
            {
                throw new ConflictException(
                    $"No se puede eliminar el vino porque tiene historial de otros usuarios (reseñas: {usage.ReviewCount}, marcas: {usage.UserWineCount}, cava: {usage.CellarItemCount}, fotos: {usage.OtherUserImagesCount}, actividades: {usage.OtherUserActivitiesCount}). Si es un duplicado, usá la fusión o rechazá sus cosechas para preservar el historial.");
            }

            throw new ConflictException(
                $"No se puede eliminar el vino porque tiene vinos duplicados apuntándole ({usage.DuplicateWinesCount}). Si es un duplicado, usá la fusión.");
        }

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

    public async Task<IEnumerable<WineListItemDto>> SearchAsync(string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, Actor? actor = null, CancellationToken ct = default)
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
        return wines.Select(w => w.ToListItemDto());
    }

    public async Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, Actor actor, CancellationToken ct = default)
    {
        if (!actor.IsAdmin)
        {
            throw new ForbiddenException("Solo un administrador puede fusionar vinos.");
        }

        if (targetId == duplicateId)
        {
            throw new ValidationException("No se puede fusionar un vino consigo mismo.");
        }

        var target = await wineRepository.GetByIdAsync(targetId, ct)
            ?? throw new NotFoundException($"El vino destino con ID {targetId} no existe.");

        var duplicate = await wineRepository.GetByIdAsync(duplicateId, ct)
            ?? throw new NotFoundException($"El vino a fusionar con ID {duplicateId} no existe.");

        if (target.DuplicateOfWineId != null)
        {
            throw new ConflictException($"El vino destino (ID {targetId}) ya es un vino duplicado y no puede recibir fusiones.");
        }

        if (duplicate.DuplicateOfWineId != null)
        {
            throw new ConflictException($"El vino origen (ID {duplicateId}) ya fue fusionado anteriormente.");
        }

        return await wineRepository.MergeWinesAsync(targetId, duplicateId, ct);
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}
