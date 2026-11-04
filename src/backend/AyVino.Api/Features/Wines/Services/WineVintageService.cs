using AyVino.Api.Features.Images.Repositories;
using Microsoft.Extensions.Options;
using AyVino.Api.Features.Wines.Configuration;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Rules;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Wines.Services;

public class WineVintageService(
    IWineVintageRepository vintageRepository,
    IWineRepository wineRepository,
    IGrapeRepository grapeRepository,
    IWineryRepository wineryRepository,
    IOptions<CommunityOptions>? communityOptions = null,
    IUserVintageImageRepository? userVintageImageRepository = null,
    IImageRepository? imageRepository = null,
    IImageStorage? imageStorage = null,
    IActivityRecorder? activityRecorder = null,
    ILogger<WineVintageService>? logger = null) : IWineVintageService
{
    public async Task<WineVintageResponseDto> GetByIdAsync(int wineId, int vintageId, Actor? actor = null, CancellationToken ct = default)
    {
        var vintage = await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);

        var wine = await wineRepository.GetByIdAsync(wineId, ct);
        Winery? winery = null;
        if (wine?.WineryId is int wid && wineryRepository != null)
        {
            winery = await wineryRepository.GetByIdAsync(wid, ct);
            if (winery != null && winery.Status != WineryStatus.Approved)
            {
                var isOwnerOrAdmin = actor?.IsAdmin == true || (actor != null && WineryAccessRules.IsOwner(winery, actor));
                if (!isOwnerOrAdmin)
                    throw new NotFoundException($"Wine with ID {wineId} not found.");
            }
        }

        // Regla de visibilidad:
        if (vintage.ApprovalStatus == ApprovalStatus.Rejected)
        {
            var isUploader = actor != null && vintage.UploadedByUserId == actor.UserId;
            var isAdmin = actor?.IsAdmin == true;
            var isWineryOwner = actor != null && WineryAccessRules.IsOwner(winery, actor);

            if (!isAdmin && !isUploader && !isWineryOwner)
            {
                throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
            }
        }
        else if (vintage.ApprovalStatus == ApprovalStatus.Pending)
        {
            var isUploader = actor != null && vintage.UploadedByUserId == actor.UserId;
            var isAdmin = actor?.IsAdmin == true;
            var isWineryOwner = actor != null && WineryAccessRules.IsOwner(winery, actor);
            var isParticipant = actor != null && (isUploader || await vintageRepository.IsUserParticipantAsync(vintageId, actor.UserId, ct));

            if (!isAdmin && !isWineryOwner && !isParticipant)
            {
                var minUsers = communityOptions?.Value?.MinUsersForPublicVisibility ?? 2;
                var userCount = await vintageRepository.GetDistinctUserCountAsync(vintageId, ct);
                if (userCount < minUsers)
                {
                    throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
                }
            }
        }

        var grapes = await vintageRepository.GetGrapesByVintageIdAsync(vintageId, ct);
        return vintage.ToResponseDto(grapes);
    }

    public async Task<IEnumerable<WineVintageResponseDto>> GetAllByWineIdAsync(int wineId, Actor? actor = null, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetByIdAsync(wineId, ct);
        if (wine is null)
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        Winery? winery = null;
        if (wine.WineryId is int wid && wineryRepository != null)
        {
            winery = await wineryRepository.GetByIdAsync(wid, ct);
            if (winery != null && winery.Status != WineryStatus.Approved)
            {
                var isOwnerOrAdmin = actor?.IsAdmin == true || (actor != null && WineryAccessRules.IsOwner(winery, actor));
                if (!isOwnerOrAdmin)
                    throw new NotFoundException($"Wine with ID {wineId} not found.");
            }
        }

        var vintages = (await vintageRepository.GetAllByWineIdAsync(wineId, ct)).ToList();
        if (vintages.Count == 0)
        {
            return [];
        }

        // Filtrar visibilidad de las cosechas:
        // Una cosecha Pending/Rejected solo la ven el dueño de la bodega, el uploader y los admin.
        var isWineryOwner = actor != null && WineryAccessRules.IsOwner(winery, actor);
        var isAdmin = actor?.IsAdmin == true;

        var minUsers = communityOptions?.Value?.MinUsersForPublicVisibility ?? 2;
        var pendingVintages = vintages.Where(v => v.ApprovalStatus == ApprovalStatus.Pending).ToList();
        IReadOnlyDictionary<int, int> counts = new Dictionary<int, int>();
        HashSet<int> participantVintageIds = [];

        if (pendingVintages.Count > 0 && !isAdmin && !isWineryOwner)
        {
            var pendingIds = pendingVintages.Select(v => v.Id).ToList();
            counts = (await vintageRepository.GetDistinctUserCountsAsync(pendingIds, ct)) ?? new Dictionary<int, int>();
            if (actor != null)
            {
                participantVintageIds = (await vintageRepository.GetParticipantVintageIdsAsync(actor.UserId, pendingIds, ct)) ?? [];
            }
        }

        vintages = vintages.Where(v =>
        {
            if (v.ApprovalStatus == ApprovalStatus.Approved)
                return true;

            if (v.ApprovalStatus == ApprovalStatus.Rejected)
                return isAdmin || isWineryOwner || (actor != null && v.UploadedByUserId == actor.UserId);

            // Pending
            if (isAdmin || isWineryOwner)
                return true;

            if (actor != null && (v.UploadedByUserId == actor.UserId || participantVintageIds.Contains(v.Id)))
                return true;

            if (counts != null && counts.TryGetValue(v.Id, out var count) && count >= minUsers)
                return true;

            return false;
        }).ToList();

        if (vintages.Count == 0)
        {
            return [];
        }

        var vintageIds = vintages.Select(v => v.Id).ToList();
        var allGrapes = await vintageRepository.GetGrapesByVintageIdsAsync(vintageIds, ct);
        var grapesByVintageId = allGrapes.ToLookup(g => g.WineVintageId);

        return vintages.Select(v => v.ToResponseDto(grapesByVintageId[v.Id]));
    }

    public async Task<WineVintageResponseDto> CreateAsync(int wineId, CreateWineVintageRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetByIdAsync(wineId, ct);
        if (wine is null)
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        bool isAutoApproved = false;
        if (wine.WineryId is int wineryId)
        {
            if (actor.IsAdmin)
            {
                isAutoApproved = true;
            }
            else
            {
                var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
                    ?? throw new ValidationException($"Winery with ID {wineryId} does not exist.");

                if (!WineryAccessRules.IsOwner(winery, actor))
                    throw new ForbiddenException("Solo el dueño de la bodega puede crear cosechas a su nombre.");

                if (!WineryAccessRules.CanPublish(winery, actor))
                    throw new ForbiddenException("La bodega debe estar aprobada o pendiente para crear cosechas.");

                isAutoApproved = true;
            }
        }
        else if (actor.IsAdmin)
        {
            isAutoApproved = true;
        }


        var existingVintages = await vintageRepository.GetAllByWineIdAsync(wineId, ct);
        var existingVintage = existingVintages.FirstOrDefault(v => v.Year == dto.Year);
        if (existingVintage is not null)
        {
            var extensions = new Dictionary<string, object?>
            {
                ["existingVintageId"] = existingVintage.Id
            };
            throw new ConflictException("Ya existe una cosecha para este año en el vino.", extensions);
        }

        await ValidateGrapesAsync(dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var vintageStatus = isAutoApproved ? ApprovalStatus.Approved : ApprovalStatus.Pending;
        var vintageEntity = dto.ToEntity(actor.UserId, wineId, vintageStatus);
        var vintage = await vintageRepository.CreateAsync(vintageEntity, grapes, ct);

        if (activityRecorder != null)
        {
            try
            {
                await activityRecorder.RecordAsync(actor.UserId, ActivityType.WineContributed, wineId, vintage.Id, ct);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Error al registrar actividad WineContributed para usuario {UserId}, vino {WineId} y cosecha {VintageId}", actor.UserId, wineId, vintage.Id);
            }
        }

        return vintage.ToResponseDto(grapes);
    }

    public Task<WineVintageResponseDto> CreateAsync(int wineId, CreateWineVintageRequestDto dto, int userId, CancellationToken ct = default) =>
        CreateAsync(wineId, dto, new Actor(userId, AppRoles.User), ct);

    public async Task<WineVintageResponseDto> UpdateAsync(int wineId, int vintageId, UpdateWineVintageRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        var vintage = await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);

        if (!actor.IsAdmin)
        {
            var isUploader = vintage.UploadedByUserId == actor.UserId;

            if (!(isUploader && vintage.ApprovalStatus == ApprovalStatus.Pending))
            {
                var wine = await wineRepository.GetByIdAsync(wineId, ct)
                    ?? throw new NotFoundException($"Wine with ID {wineId} not found.");
                var winery = wine.WineryId is int wineryId
                    ? await wineryRepository.GetByIdAsync(wineryId, ct)
                    : null;

                if (!WineryAccessRules.IsOwner(winery, actor))
                    throw new ForbiddenException(isUploader
                        ? "No podés editar una cosecha que ya fue moderada."
                        : "No tenés permiso para editar esta cosecha.");

                if (!WineryAccessRules.CanPublish(winery, actor))
                    throw new ForbiddenException("La bodega debe estar aprobada o pendiente para editar cosechas.");
            }
        }


        await ValidateGrapesAsync(dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var vintageEntity = dto.ToEntity(vintageId, wineId);
        var updated = await vintageRepository.UpdateAsync(vintageEntity, grapes, ct);
        if (!updated) throw new NotFoundException($"Vintage with ID {vintageId} not found.");

        return await GetByIdAsync(wineId, vintageId, actor, ct);
    }

    public async Task<WineVintageResponseDto> ChangeStatusAsync(int wineId, int vintageId, ChangeWineVintageStatusRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status) || !Enum.TryParse<ApprovalStatus>(dto.Status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{dto.Status}'.");

        await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);

        var updated = await vintageRepository.UpdateStatusAsync(vintageId, (int)parsedStatus, ct);
        if (!updated) throw new NotFoundException($"Vintage with ID {vintageId} not found.");

        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct)
            ?? throw new NotFoundException($"Vintage with ID {vintageId} not found.");
        var grapes = await vintageRepository.GetGrapesByVintageIdAsync(vintageId, ct);
        return vintage.ToResponseDto(grapes);
    }

    public Task DeleteAsync(int wineId, int vintageId, CancellationToken ct = default) =>
        DeleteAsync(wineId, vintageId, null, ct);

    public async Task DeleteAsync(int wineId, int vintageId, int? currentUserId, CancellationToken ct = default)
    {
        var vintage = await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);
        var usage = currentUserId.HasValue
            ? await vintageRepository.GetUsageCountsAsync(vintageId, currentUserId.Value, ct)
            : await vintageRepository.GetUsageCountsAsync(vintageId, ct);
        if (usage.HasUserHistory)
        {
            throw new ConflictException(
                $"No se puede eliminar la cosecha porque tiene historial de otros usuarios (reseñas: {usage.ReviewCount}, cava: {usage.CellarItemCount}, fotos: {usage.OtherUserImagesCount}, actividades: {usage.OtherUserActivitiesCount}). Podés rechazarla en lugar de eliminarla para preservar el historial.");
        }
        await vintageRepository.DeleteAsync(vintageId, ct);
    }

    public async Task<IEnumerable<AdminWineVintageListItemDto>> GetPagedForAdminAsync(int pageNumber, int pageSize, string? status, string? sort, CancellationToken ct = default)
    {
        if (pageNumber <= 0)
            throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100)
            throw new ValidationException("pageSize debe estar entre 1 y 100.");

        if (!string.IsNullOrWhiteSpace(sort) && !string.Equals(sort, "users", StringComparison.OrdinalIgnoreCase) && !string.Equals(sort, "date", StringComparison.OrdinalIgnoreCase))
            throw new ValidationException($"Parámetro 'sort' inválido: '{sort}'. Valores permitidos: 'users', 'date'.");

        int? statusValue = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<ApprovalStatus>(status, ignoreCase: true, out var parsedStatus) || !Enum.IsDefined(parsedStatus))
                throw new ValidationException($"Invalid status: '{status}'.");
            statusValue = (int)parsedStatus;
        }

        var rows = string.IsNullOrWhiteSpace(sort)
            ? await vintageRepository.GetPagedForAdminAsync(pageNumber, pageSize, statusValue, ct)
            : await vintageRepository.GetPagedForAdminAsync(pageNumber, pageSize, statusValue, sort, ct);
        return rows.ToListItemDtoList();
    }

    public Task<IEnumerable<AdminWineVintageListItemDto>> GetPagedForAdminAsync(int pageNumber, int pageSize, string? status, CancellationToken ct = default) =>
        GetPagedForAdminAsync(pageNumber, pageSize, status, null, ct);

    public async Task<IEnumerable<VintageContributionDto>> GetContributionsAsync(int vintageId, CancellationToken ct = default)
    {
        var exists = await vintageRepository.ExistsByIdAsync(vintageId, ct);
        if (!exists)
            throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada.");

        return await vintageRepository.GetContributionsAsync(vintageId, ct);
    }

    public async Task<PromoteVintageImageResponseDto> PromoteImageAsync(int vintageId, int userId, Actor actor, CancellationToken ct = default)
    {
        if (!actor.IsAdmin)
            throw new ForbiddenException("Solo un administrador puede promover imágenes de cosechas.");

        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct)
            ?? throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada.");

        if (userVintageImageRepository is null)
            throw new InvalidOperationException("UserVintageImageRepository no está configurado.");

        var personalImageId = await userVintageImageRepository.GetImageIdAsync(userId, vintageId, ct);
        if (!personalImageId.HasValue)
            throw new NotFoundException($"El usuario con ID {userId} no tiene una foto personal para la cosecha {vintageId}.");

        var oldImageId = vintage.ImageId;
        await vintageRepository.UpdateImageIdAsync(vintageId, personalImageId.Value, ct);

        if (oldImageId.HasValue && oldImageId.Value != personalImageId.Value)
        {
            try
            {
                if (imageRepository != null && !await imageRepository.IsReferencedAsync(oldImageId.Value, ct))
                {
                    var oldImg = await imageRepository.GetByIdAsync(oldImageId.Value, ct);
                    await imageRepository.DeleteAsync(oldImageId.Value, ct);
                    if (oldImg != null && imageStorage != null)
                    {
                        await imageStorage.DeleteAsync(oldImg.ExternalId, ct);
                    }
                }
            }
            catch
            {
                // Best-effort delete of previous public image
            }
        }

        return new PromoteVintageImageResponseDto(vintageId, personalImageId.Value);
    }

    // El "ownership check" (wineId de la URL vs. wine_id real del vintage) evita que alguien
    // pida /api/wines/5/vintages/99 cuando el vintage 99 en realidad es de otra etiqueta.
    private async Task<WineVintage> GetOwnedVintageOrThrowAsync(int wineId, int vintageId, CancellationToken ct)
    {
        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct);
        if (vintage is null || vintage.WineId != wineId)
            throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
        return vintage;
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

        // Base legal (INV/UE/EEUU): <=100%, no exactamente 100%, por blends y uvas no declaradas.
        var total = grapes.Sum(g => g.Percentage ?? 0);
        if (total > 100)
            throw new ValidationException("The sum of the grape percentages cannot exceed 100%.");
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}
