using AyVino.Api.Features.WineCare.DTOs;

namespace AyVino.Api.Features.WineCare.Services;

public interface IWineCareService
{
    Task<WineCareResponseDto> GetForVintageAsync(int wineId, int wineVintageId, CancellationToken ct = default);
    Task<IReadOnlyList<WineCareResponseDto>> GetForVintagesAsync(IReadOnlyCollection<int> wineVintageIds, CancellationToken ct = default);
}