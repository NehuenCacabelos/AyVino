using AyVino.Api.Features.Wineries.DTOs;

namespace AyVino.Api.Features.Wineries.Services;

public interface IWineryMapCenterResolver
{
    Task<WineryMapCenterDto> ResolveMapCenterAsync(
        decimal? latitude,
        decimal? longitude,
        string? departmentName,
        string? provinceName,
        string? departmentGeorefId = null,
        CancellationToken ct = default);
}
