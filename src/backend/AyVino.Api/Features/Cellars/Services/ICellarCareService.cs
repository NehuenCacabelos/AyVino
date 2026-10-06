using AyVino.Api.Features.WineCare.DTOs;

namespace AyVino.Api.Features.Cellars.Services;

public interface ICellarCareService
{
    Task<IReadOnlyList<WineCareResponseDto>> GetSummaryAsync(int userId, int cellarId, CancellationToken ct = default);
}