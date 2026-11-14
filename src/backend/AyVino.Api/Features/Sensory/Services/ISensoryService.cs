using AyVino.Api.Common.Security;
using AyVino.Api.Features.Sensory.DTOs;

namespace AyVino.Api.Features.Sensory.Services;

public interface ISensoryService
{
    Task<VintageSensoryDto> GetSensoryByVintageIdAsync(int wineId, int vintageId, Actor? actor = null, CancellationToken ct = default);
    Task<VintageSensoryDto> UpdateSensoryAsync(int wineId, int vintageId, UpdateVintageSensoryRequestDto request, Actor actor, CancellationToken ct = default);
    Task<VintageSensoryDto> PreviewSensoryAsync(SensoryPreviewRequestDto request, CancellationToken ct = default);
}
