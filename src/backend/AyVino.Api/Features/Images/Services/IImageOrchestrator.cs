using AyVino.Api.Common.Security;
using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Features.Images.Services;

public interface IImageOrchestrator
{
    Task<Guid> UploadAvatarAsync(int userId, IFormFile file, CancellationToken ct = default);
    Task DeleteAvatarAsync(int userId, CancellationToken ct = default);

    Task<Guid> UploadWineryLogoAsync(int wineryId, IFormFile file, Actor actor, CancellationToken ct = default);
    Task DeleteWineryLogoAsync(int wineryId, Actor actor, CancellationToken ct = default);

    Task<Guid> UploadWineryBannerAsync(int wineryId, IFormFile file, Actor actor, CancellationToken ct = default);
    Task DeleteWineryBannerAsync(int wineryId, Actor actor, CancellationToken ct = default);

    Task<Guid> UploadVintageImageAsync(int wineId, int vintageId, IFormFile file, Actor actor, CancellationToken ct = default);
    Task DeleteVintageImageAsync(int wineId, int vintageId, Actor actor, CancellationToken ct = default);
}
