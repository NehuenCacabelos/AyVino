using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Wines.Services;

public class WineVintageService(
    IWineVintageRepository vintageRepository,
    IWineRepository wineRepository,
    IGrapeRepository grapeRepository) : IWineVintageService
{
    public async Task<WineVintageResponseDto> GetByIdAsync(int wineId, int vintageId, CancellationToken ct = default)
    {
        var vintage = await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);
        var grapes = await vintageRepository.GetGrapesByVintageIdAsync(vintageId, ct);
        return vintage.ToResponseDto(grapes);
    }

    public async Task<IEnumerable<WineVintageResponseDto>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        if (!await wineRepository.ExistsByIdAsync(wineId, ct))
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        var vintages = (await vintageRepository.GetAllByWineIdAsync(wineId, ct)).ToList();
        if (vintages.Count == 0)
        {
            return [];
        }

        var vintageIds = vintages.Select(v => v.Id).ToList();
        var allGrapes = await vintageRepository.GetGrapesByVintageIdsAsync(vintageIds, ct);
        var grapesByVintageId = allGrapes.ToLookup(g => g.WineVintageId);

        return vintages.Select(v => v.ToResponseDto(grapesByVintageId[v.Id]));
    }

    public async Task<WineVintageResponseDto> CreateAsync(int wineId, CreateWineVintageRequestDto dto, int userId, CancellationToken ct = default)
    {
        if (!await wineRepository.ExistsByIdAsync(wineId, ct))
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        await ValidateGrapesAsync(dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var vintageEntity = dto.ToEntity(userId, wineId);
        var vintage = await vintageRepository.CreateAsync(vintageEntity, grapes, ct);
        return vintage.ToResponseDto(grapes);
    }

    public async Task<WineVintageResponseDto> UpdateAsync(int wineId, int vintageId, UpdateWineVintageRequestDto dto, CancellationToken ct = default)
    {
        await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);

        await ValidateGrapesAsync(dto.Grapes, ct);
        var grapes = ToWineGrapes(dto.Grapes);

        var vintageEntity = dto.ToEntity(vintageId, wineId);
        var updated = await vintageRepository.UpdateAsync(vintageEntity, grapes, ct);
        if (!updated) throw new NotFoundException($"Vintage with ID {vintageId} not found.");

        return await GetByIdAsync(wineId, vintageId, ct);
    }

    public async Task<WineVintageResponseDto> ChangeStatusAsync(int wineId, int vintageId, ChangeWineVintageStatusRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status) || !Enum.TryParse<ApprovalStatus>(dto.Status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{dto.Status}'.");

        await GetOwnedVintageOrThrowAsync(wineId, vintageId, ct);

        var updated = await vintageRepository.UpdateStatusAsync(vintageId, (int)parsedStatus, ct);
        if (!updated) throw new NotFoundException($"Vintage with ID {vintageId} not found.");

        return await GetByIdAsync(wineId, vintageId, ct);
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

        // Misma base legal (INV/UE/EEUU) documentada en la sesión original de Wines:
        // <=100%, no exactamente 100%, por blends encubiertos y "otras uvas" no declaradas.
        var total = grapes.Sum(g => g.Percentage ?? 0);
        if (total > 100)
            throw new ValidationException("The sum of the grape percentages cannot exceed 100%.");
    }

    private static List<WineGrape> ToWineGrapes(List<WineGrapeRequestDto>? grapes) =>
        grapes?.Select(g => new WineGrape { GrapeId = g.GrapeId, Percentage = g.Percentage }).ToList() ?? [];
}