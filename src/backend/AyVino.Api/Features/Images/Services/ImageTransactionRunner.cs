using AyVino.Api.Common.Data;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Images.Services;

public class ImageTransactionRunner(
    IDbConnectionFactory connectionFactory,
    IImageRepository imageRepository,
    IUserRepository userRepository,
    IWineryRepository wineryRepository,
    IWineVintageRepository vintageRepository) : IImageTransactionRunner
{
    public async Task AttachAvatarAsync(Image image, int userId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await imageRepository.InsertAsync(image, connection, transaction, ct);
        await userRepository.UpdateAvatarImageIdAsync(userId, image.Id, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task DetachAndDeleteAvatarAsync(int userId, Guid imageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await userRepository.UpdateAvatarImageIdAsync(userId, null, connection, transaction, ct);
        await imageRepository.DeleteAsync(imageId, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task AttachWineryLogoAsync(Image image, int wineryId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await imageRepository.InsertAsync(image, connection, transaction, ct);
        await wineryRepository.UpdateLogoImageIdAsync(wineryId, image.Id, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task DetachAndDeleteWineryLogoAsync(int wineryId, Guid imageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await wineryRepository.UpdateLogoImageIdAsync(wineryId, null, connection, transaction, ct);
        await imageRepository.DeleteAsync(imageId, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task AttachWineryBannerAsync(Image image, int wineryId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await imageRepository.InsertAsync(image, connection, transaction, ct);
        await wineryRepository.UpdateBannerImageIdAsync(wineryId, image.Id, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task DetachAndDeleteWineryBannerAsync(int wineryId, Guid imageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await wineryRepository.UpdateBannerImageIdAsync(wineryId, null, connection, transaction, ct);
        await imageRepository.DeleteAsync(imageId, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task AttachVintageImageAsync(Image image, int vintageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await imageRepository.InsertAsync(image, connection, transaction, ct);
        await vintageRepository.UpdateImageIdAsync(vintageId, image.Id, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }

    public async Task DetachAndDeleteVintageImageAsync(int vintageId, Guid imageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        await vintageRepository.UpdateImageIdAsync(vintageId, null, connection, transaction, ct);
        await imageRepository.DeleteAsync(imageId, connection, transaction, ct);

        await transaction.CommitAsync(ct);
    }
}
