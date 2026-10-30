using AyVino.Api.Features.Images.Models;

namespace AyVino.Api.Features.Images.Services;

public interface IImageTransactionRunner
{
    Task AttachAvatarAsync(Image image, int userId, CancellationToken ct = default);
    Task DetachAndDeleteAvatarAsync(int userId, Guid imageId, CancellationToken ct = default);

    Task AttachWineryLogoAsync(Image image, int wineryId, CancellationToken ct = default);
    Task DetachAndDeleteWineryLogoAsync(int wineryId, Guid imageId, CancellationToken ct = default);

    Task AttachWineryBannerAsync(Image image, int wineryId, CancellationToken ct = default);
    Task DetachAndDeleteWineryBannerAsync(int wineryId, Guid imageId, CancellationToken ct = default);

    Task AttachVintageImageAsync(Image image, int vintageId, CancellationToken ct = default);
    Task DetachAndDeleteVintageImageAsync(int vintageId, Guid imageId, CancellationToken ct = default);
}
