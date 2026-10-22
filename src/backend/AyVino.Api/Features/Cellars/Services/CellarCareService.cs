using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.WineCare.DTOs;
using AyVino.Api.Features.WineCare.Services;

namespace AyVino.Api.Features.Cellars.Services;

// Cellars depende de WineCare (solo en este sentido): WineCare no sabe que existen las cavas.
public class CellarCareService(
    ICellarRepository cellarRepository,
    ICellarItemRepository itemRepository,
    IWineCareService wineCareService) : ICellarCareService
{
    public async Task<IReadOnlyList<WineCareResponseDto>> GetSummaryAsync(int userId, int cellarId, CancellationToken ct = default)
    {
        // Si la cava no existe o es de otro usuario: 404, sin revelar cuál de los dos casos es.
        _ = await cellarRepository.GetByIdAsync(cellarId, userId, ct)
            ?? throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");

        var vintageIds = await itemRepository.GetVintageIdsAsync(cellarId, ct);
        return await wineCareService.GetForVintagesAsync(vintageIds, ct);
    }
}