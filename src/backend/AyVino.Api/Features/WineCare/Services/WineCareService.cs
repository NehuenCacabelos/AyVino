using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.WineCare.DTOs;
using AyVino.Api.Features.WineCare.Models;
using AyVino.Api.Features.WineCare.Repositories;
using AyVino.Api.Features.WineCare.Rules;

namespace AyVino.Api.Features.WineCare.Services;

public class WineCareService(IWineCareRepository repository) : IWineCareService
{
    public async Task<WineCareResponseDto> GetForVintageAsync(int wineId, int wineVintageId, CancellationToken ct = default)
    {
        var vintage = (await repository.GetVintageRowsAsync([wineVintageId], ct)).SingleOrDefault();

        // Mismo criterio que el resto de las cosechas: si no existe o es de otra etiqueta, 404.
        if (vintage is null || vintage.WineId != wineId)
            throw new NotFoundException($"Cosecha con ID {wineVintageId} no encontrada para el vino {wineId}.");

        var grapes = await repository.GetGrapeRowsAsync([wineVintageId], ct);
        return Evaluate(vintage, grapes, DateTime.UtcNow.Year);
    }

    // Para el resumen de una cava: una sola carga para todas las cosechas. Los ids que no existen se omiten.
    public async Task<IReadOnlyList<WineCareResponseDto>> GetForVintagesAsync(IReadOnlyCollection<int> wineVintageIds, CancellationToken ct = default)
    {
        if (wineVintageIds.Count == 0) return [];

        var ids = wineVintageIds.Distinct().ToList();
        var vintages = await repository.GetVintageRowsAsync(ids, ct);
        var grapesByVintage = (await repository.GetGrapeRowsAsync(ids, ct)).ToLookup(g => g.WineVintageId);
        var currentYear = DateTime.UtcNow.Year;

        return vintages
            .Select(v => Evaluate(v, grapesByVintage[v.WineVintageId], currentYear))
            .ToList();
    }

    private static WineCareResponseDto Evaluate(WineCareVintageRow vintage, IEnumerable<WineCareGrapeRow> grapes, int currentYear)
    {
        var input = new WineCareInput(
            vintage.WineType,
            vintage.Year,
            GrapeStructureCalculator.Calculate(grapes),
            vintage.ServingTemperature,
            vintage.AgingAdvice);

        return WineCareRules.Evaluate(input, currentYear).ToResponseDto(vintage.WineVintageId);
    }
}