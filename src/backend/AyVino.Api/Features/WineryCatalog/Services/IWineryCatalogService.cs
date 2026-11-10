using AyVino.Api.Common.Security;
using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Models;

namespace AyVino.Api.Features.WineryCatalog.Services;

public interface IWineryCatalogService
{
    Task<WineryCatalogResponseDto> GetMyCatalogAsync(int userId, CancellationToken ct = default);
    Task<WineryPublicProfileResponseDto> GetPublicProfileAsync(int wineryId, Actor? actor, CancellationToken ct = default);
    Task<WineryPublicCatalogResponseDto> GetPublicCatalogAsync(int wineryId, Actor? actor, WineryPublicCatalogQueryParams query, CancellationToken ct = default);
}
