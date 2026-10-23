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
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Wines.Services;

public class WineVintageService(
    IWineVintageRepository vintageRepository,
    IWineRepository wineRepository,
    IGrapeRepository grapeRepository,
    IWineryRepository wineryRepository,
    IImageStorage? imageStorage = null) : IWineVintageService
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
        // Una añada Pending/Rejected solo la ven el dueño, el uploader y los admin.
        if (vintage.ApprovalStatus != ApprovalStatus.Approved)
        {
            var isUploader = actor != null && vintage.UploadedByUserId == actor.UserId;
            var isAdmin = actor?.IsAdmin == true;
            var isWineryOwner = actor != null && WineryAccessRules.IsOwner(winery, actor);

            if (!isAdmin && !isUploader && !isWineryOwner)
            {
                throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
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

        vintages = vintages.Where(v =>
            v.ApprovalStatus == ApprovalStatus.Approved
            || isAdmin
            || isWineryOwner
            || (actor != null && v.UploadedByUserId == actor.UserId)
        ).ToList();

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

        if (wine.WineryId is int wineryId && !actor.IsAdmin)
        {
            var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
                ?? throw new ValidationException($"Winery with ID {wineryId} does not exist.");

            if (!WineryAccessRules.IsOwner(winery, actor))
                throw new ForbiddenException("Solo el dueño de la bodega puede crear cosechas a su nombre.");

            if (!WineryAccessRules.CanPublish(winery, actor))
                throw new ForbiddenException("La bodega debe estar aprobada o pendiente para crear cosechas.");
        }

        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            if (imageStorage != null && !imageStorage.IsUrlFromStorage(dto.ImageUrl))
                throw new ValidationException("La URL de la imagen debe pertenecer al almacenamiento oficial del sistema.");
        }

        await ValidateGrapesAsync(dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var vintageEntity = dto.ToEntity(actor.UserId, wineId);
        var vintage = await vintageRepository.CreateAsync(vintageEntity, grapes, ct);
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

        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            if (imageStorage != null && !imageStorage.IsUrlFromStorage(dto.ImageUrl))
                throw new ValidationException("La URL de la imagen debe pertenecer al almacenamiento oficial del sistema.");
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

    public async Task DeleteAsync(int wineId, int vintageId, CancellationToken ct = default)
    {
        await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);
        await vintageRepository.DeleteAsync(vintageId, ct);
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
