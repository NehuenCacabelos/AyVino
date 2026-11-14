using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Sensory.DTOs;
using AyVino.Api.Features.Sensory.Models;
using AyVino.Api.Features.Sensory.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Rules;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Sensory.Services;

public class SensoryService(
    ISensoryRepository sensoryRepository,
    IWineVintageRepository vintageRepository,
    IWineRepository wineRepository,
    IWineryRepository wineryRepository) : ISensoryService
{
    private static readonly string[] AxisKeys = ["body", "tannins", "acidity", "fruit", "oak", "persistence"];

    public async Task<VintageSensoryDto> GetSensoryByVintageIdAsync(int wineId, int vintageId, Actor? actor = null, CancellationToken ct = default)
    {
        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct);
        if (vintage is null || vintage.WineId != wineId)
        {
            throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
        }

        var wine = await wineRepository.GetByIdAsync(wineId, ct);
        if (wine is null)
        {
            throw new NotFoundException($"Wine with ID {wineId} not found.");
        }

        if (wine.WineryId is int wid)
        {
            var winery = await wineryRepository.GetByIdAsync(wid, ct);
            if (winery != null && winery.Status != WineryStatus.Approved)
            {
                var isOwnerOrAdmin = actor?.IsAdmin == true || (actor != null && WineryAccessRules.IsOwner(winery, actor));
                if (!isOwnerOrAdmin)
                {
                    throw new NotFoundException($"Wine with ID {wineId} not found.");
                }
            }
        }

        if (vintage.ApprovalStatus != ApprovalStatus.Approved)
        {
            var isUploader = actor != null && vintage.UploadedByUserId == actor.UserId;
            var isAdmin = actor?.IsAdmin == true;
            var isWineryOwner = false;
            if (actor != null && wine.WineryId is int wineryId)
            {
                var winery = await wineryRepository.GetByIdAsync(wineryId, ct);
                isWineryOwner = winery != null && WineryAccessRules.IsOwner(winery, actor);
            }

            if (!isAdmin && !isUploader && !isWineryOwner)
            {
                throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
            }
        }

        var manual = await sensoryRepository.GetByVintageIdAsync(vintageId, ct);
        var grapes = await sensoryRepository.GetVintageGrapesWithTypicalValuesAsync(vintageId, ct);

        var calc = SensoryProfileCalculator.Calculate(
            grapes.Select(g => (g.Percentage, g.TypicalBody, g.TypicalTannins, g.TypicalAcidity)).ToList());

        var axes = BuildAxes(manual, calc);
        return new VintageSensoryDto(axes);
    }

    public async Task<VintageSensoryDto> UpdateSensoryAsync(int wineId, int vintageId, UpdateVintageSensoryRequestDto request, Actor actor, CancellationToken ct = default)
    {
        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct);
        if (vintage is null || vintage.WineId != wineId)
        {
            throw new NotFoundException($"Vintage with ID {vintageId} not found for wine {wineId}.");
        }

        var wine = await wineRepository.GetByIdAsync(wineId, ct);
        if (wine is null)
        {
            throw new NotFoundException($"Wine with ID {wineId} not found.");
        }

        if (!actor.IsAdmin)
        {
            if (wine.WineryId is not int wid)
            {
                throw new ForbiddenException("No tenés permiso para editar el perfil sensorial de esta cosecha.");
            }

            var winery = await wineryRepository.GetByIdAsync(wid, ct);
            if (winery == null || !WineryAccessRules.IsOwner(winery, actor))
            {
                throw new ForbiddenException("No tenés permiso para editar el perfil sensorial de esta cosecha.");
            }
        }

        ValidateAxisValue(request.Body, "Cuerpo");
        ValidateAxisValue(request.Tannins, "Taninos");
        ValidateAxisValue(request.Acidity, "Acidez");
        ValidateAxisValue(request.Fruit, "Fruta");
        ValidateAxisValue(request.Oak, "Crianza");
        ValidateAxisValue(request.Persistence, "Persistencia");

        bool allNull = request.Body == null
                    && request.Tannins == null
                    && request.Acidity == null
                    && request.Fruit == null
                    && request.Oak == null
                    && request.Persistence == null;

        if (allNull)
        {
            await sensoryRepository.DeleteAsync(vintageId, ct);
        }
        else
        {
            var entity = new WineVintageSensory
            {
                WineVintageId = vintageId,
                Body = request.Body,
                Tannins = request.Tannins,
                Acidity = request.Acidity,
                Fruit = request.Fruit,
                Oak = request.Oak,
                Persistence = request.Persistence,
                UpdatedAt = DateTime.UtcNow
            };
            await sensoryRepository.UpsertAsync(entity, ct);
        }

        return await GetSensoryByVintageIdAsync(wineId, vintageId, actor, ct);
    }

    public async Task<VintageSensoryDto> PreviewSensoryAsync(SensoryPreviewRequestDto request, CancellationToken ct = default)
    {
        if (request.Grapes != null)
        {
            if (request.Grapes.Count > 20)
            {
                throw new ValidationException("No se pueden especificar más de 20 uvas para la previsualización.");
            }

            foreach (var g in request.Grapes)
            {
                if (g.Percentage.HasValue && (g.Percentage.Value < 0m || g.Percentage.Value > 100m))
                {
                    throw new ValidationException("El porcentaje de cada uva debe estar entre 0 y 100.");
                }
            }

            var grapeIds = request.Grapes.Select(g => g.GrapeId).Distinct().ToList();
            var typicalValues = await sensoryRepository.GetGrapeTypicalValuesByIdsAsync(grapeIds, ct);

            foreach (var id in grapeIds)
            {
                if (!typicalValues.ContainsKey(id))
                {
                    throw new ValidationException($"La uva con ID {id} no existe.");
                }
            }

            var blendInput = request.Grapes.Select(g => new GrapeBlendInput(g.GrapeId, g.Percentage));
            var dict = typicalValues.ToDictionary(
                k => k.Key,
                v => new GrapeSensoryValues(v.Value.TypicalBody, v.Value.TypicalTannins, v.Value.TypicalAcidity));

            var calc = SensoryProfileCalculator.Calculate(blendInput, dict);
            var axes = BuildAxes(manual: null, calc);
            return new VintageSensoryDto(axes);
        }
        else
        {
            var calc = new CalculatedSensoryProfile(null, null, null, null, null, null);
            var axes = BuildAxes(manual: null, calc);
            return new VintageSensoryDto(axes);
        }
    }

    private static void ValidateAxisValue(decimal? value, string axisName)
    {
        if (!value.HasValue) return;

        if (value.Value < 1.0m || value.Value > 5.0m)
        {
            throw new ValidationException($"El valor de {axisName} debe estar entre 1,0 y 5,0.");
        }

        if (decimal.Round(value.Value, 1) != value.Value)
        {
            throw new ValidationException($"El valor de {axisName} no puede tener más de un decimal.");
        }
    }

    private static IReadOnlyList<SensoryAxisDto> BuildAxes(WineVintageSensory? manual, CalculatedSensoryProfile calc)
    {
        return
        [
            CreateAxis("body", manual?.Body, calc.Body),
            CreateAxis("tannins", manual?.Tannins, calc.Tannins),
            CreateAxis("acidity", manual?.Acidity, calc.Acidity),
            CreateAxis("fruit", manual?.Fruit, calc.Fruit),
            CreateAxis("oak", manual?.Oak, calc.Oak),
            CreateAxis("persistence", manual?.Persistence, calc.Persistence)
        ];
    }

    private static SensoryAxisDto CreateAxis(string key, decimal? manualValue, decimal? calculatedValue)
    {
        if (manualValue.HasValue)
        {
            return new SensoryAxisDto(key, manualValue.Value, "Winery", calculatedValue);
        }

        if (calculatedValue.HasValue)
        {
            return new SensoryAxisDto(key, calculatedValue.Value, "Calculated", calculatedValue.Value);
        }

        return new SensoryAxisDto(key, null, "None", null);
    }
}
