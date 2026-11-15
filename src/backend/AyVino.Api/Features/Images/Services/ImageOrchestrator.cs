using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Rules;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Images.Services;

public class ImageOrchestrator(
    IImageTransactionRunner transactionRunner,
    IImageStorage imageStorage,
    IImageRepository imageRepository,
    IUserRepository userRepository,
    IWineryRepository wineryRepository,
    IWineRepository wineRepository,
    IWineVintageRepository vintageRepository,
    ILogger<ImageOrchestrator> logger) : IImageOrchestrator
{
    public async Task<Guid> UploadAvatarAsync(int userId, IFormFile file, CancellationToken ct = default)
    {
        var (ext, mime) = ImageValidator.Validate(file);

        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException($"Usuario con ID {userId} no encontrado.");

        var newImageId = Guid.NewGuid();
        using var stream = file.OpenReadStream();
        var uploadResult = await imageStorage.UploadAsync(newImageId, stream, mime, ImageType.Avatar, ct);

        var oldImageId = user.AvatarImageId;

        try
        {
            var imageRecord = new Image
            {
                Id = newImageId,
                Provider = "cloudinary",
                ExternalId = uploadResult.ExternalId,
                MimeType = mime,
                SizeBytes = uploadResult.SizeBytes,
                Width = uploadResult.Width,
                Height = uploadResult.Height,
                CreatedAt = DateTime.UtcNow
            };

            await transactionRunner.AttachAvatarAsync(imageRecord, userId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fallo en transacción DB al actualizar avatar de usuario {UserId}. Compensando borrado en Cloudinary para {ExternalId}", userId, uploadResult.ExternalId);
            try
            {
                await imageStorage.DeleteAsync(uploadResult.ExternalId, ct);
            }
            catch (Exception compEx)
            {
                logger.LogError(compEx, "Fallo al compensar borrado en Cloudinary para {ExternalId}", uploadResult.ExternalId);
            }
            throw;
        }

        if (oldImageId.HasValue)
        {
            await BestEffortDeleteImageAsync(oldImageId.Value, ct);
        }

        return newImageId;
    }

    public async Task DeleteAvatarAsync(int userId, CancellationToken ct = default)
    {
        var user = await userRepository.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException($"Usuario con ID {userId} no encontrado.");

        if (!user.AvatarImageId.HasValue)
        {
            return;
        }

        var imageId = user.AvatarImageId.Value;
        var image = await imageRepository.GetByIdAsync(imageId, ct);

        await transactionRunner.DetachAndDeleteAvatarAsync(userId, imageId, ct);

        if (image != null)
        {
            try
            {
                await imageStorage.DeleteAsync(image.ExternalId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error al eliminar imagen {ExternalId} de Cloudinary tras eliminar avatar de DB", image.ExternalId);
            }
        }
    }

    public async Task<Guid> UploadWineryLogoAsync(int wineryId, IFormFile file, Actor actor, CancellationToken ct = default)
    {
        var (ext, mime) = ImageValidator.Validate(file);

        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Bodega con ID {wineryId} no encontrada.");

        if (!WineryAccessRules.CanManage(winery, actor))
        {
            throw new ForbiddenException(winery.UserId is null
                ? "Solo un administrador puede editar una bodega sin dueño."
                : "No tienes permisos para modificar esta bodega.");
        }

        var newImageId = Guid.NewGuid();
        using var stream = file.OpenReadStream();
        var uploadResult = await imageStorage.UploadAsync(newImageId, stream, mime, ImageType.WineryLogo, ct);

        var oldImageId = winery.LogoImageId;

        try
        {
            var imageRecord = new Image
            {
                Id = newImageId,
                Provider = "cloudinary",
                ExternalId = uploadResult.ExternalId,
                MimeType = mime,
                SizeBytes = uploadResult.SizeBytes,
                Width = uploadResult.Width,
                Height = uploadResult.Height,
                CreatedAt = DateTime.UtcNow
            };

            await transactionRunner.AttachWineryLogoAsync(imageRecord, wineryId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fallo en transacción DB al actualizar logo de bodega {WineryId}. Compensando borrado en Cloudinary para {ExternalId}", wineryId, uploadResult.ExternalId);
            try
            {
                await imageStorage.DeleteAsync(uploadResult.ExternalId, ct);
            }
            catch (Exception compEx)
            {
                logger.LogError(compEx, "Fallo al compensar borrado en Cloudinary para {ExternalId}", uploadResult.ExternalId);
            }
            throw;
        }

        if (oldImageId.HasValue)
        {
            await BestEffortDeleteImageAsync(oldImageId.Value, ct);
        }

        return newImageId;
    }

    public async Task DeleteWineryLogoAsync(int wineryId, Actor actor, CancellationToken ct = default)
    {
        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Bodega con ID {wineryId} no encontrada.");

        if (!WineryAccessRules.CanManage(winery, actor))
        {
            throw new ForbiddenException(winery.UserId is null
                ? "Solo un administrador puede editar una bodega sin dueño."
                : "No tienes permisos para modificar esta bodega.");
        }

        if (!winery.LogoImageId.HasValue)
        {
            return;
        }

        var imageId = winery.LogoImageId.Value;
        var image = await imageRepository.GetByIdAsync(imageId, ct);

        await transactionRunner.DetachAndDeleteWineryLogoAsync(wineryId, imageId, ct);

        if (image != null)
        {
            try
            {
                await imageStorage.DeleteAsync(image.ExternalId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error al eliminar imagen {ExternalId} de Cloudinary tras eliminar logo de bodega", image.ExternalId);
            }
        }
    }

    public async Task<Guid> UploadWineryBannerAsync(int wineryId, IFormFile file, Actor actor, CancellationToken ct = default)
    {
        var (ext, mime) = ImageValidator.Validate(file);

        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Bodega con ID {wineryId} no encontrada.");

        if (!WineryAccessRules.CanManage(winery, actor))
        {
            throw new ForbiddenException(winery.UserId is null
                ? "Solo un administrador puede editar una bodega sin dueño."
                : "No tienes permisos para modificar esta bodega.");
        }

        var newImageId = Guid.NewGuid();
        using var stream = file.OpenReadStream();
        var uploadResult = await imageStorage.UploadAsync(newImageId, stream, mime, ImageType.WineryBanner, ct);

        var oldImageId = winery.BannerImageId;

        try
        {
            var imageRecord = new Image
            {
                Id = newImageId,
                Provider = "cloudinary",
                ExternalId = uploadResult.ExternalId,
                MimeType = mime,
                SizeBytes = uploadResult.SizeBytes,
                Width = uploadResult.Width,
                Height = uploadResult.Height,
                CreatedAt = DateTime.UtcNow
            };

            await transactionRunner.AttachWineryBannerAsync(imageRecord, wineryId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fallo en transacción DB al actualizar banner de bodega {WineryId}. Compensando borrado en Cloudinary para {ExternalId}", wineryId, uploadResult.ExternalId);
            try
            {
                await imageStorage.DeleteAsync(uploadResult.ExternalId, ct);
            }
            catch (Exception compEx)
            {
                logger.LogError(compEx, "Fallo al compensar borrado en Cloudinary para {ExternalId}", uploadResult.ExternalId);
            }
            throw;
        }

        if (oldImageId.HasValue)
        {
            await BestEffortDeleteImageAsync(oldImageId.Value, ct);
        }

        return newImageId;
    }

    public async Task DeleteWineryBannerAsync(int wineryId, Actor actor, CancellationToken ct = default)
    {
        var winery = await wineryRepository.GetByIdAsync(wineryId, ct)
            ?? throw new NotFoundException($"Bodega con ID {wineryId} no encontrada.");

        if (!WineryAccessRules.CanManage(winery, actor))
        {
            throw new ForbiddenException(winery.UserId is null
                ? "Solo un administrador puede editar una bodega sin dueño."
                : "No tienes permisos para modificar esta bodega.");
        }

        if (!winery.BannerImageId.HasValue)
        {
            return;
        }

        var imageId = winery.BannerImageId.Value;
        var image = await imageRepository.GetByIdAsync(imageId, ct);

        await transactionRunner.DetachAndDeleteWineryBannerAsync(wineryId, imageId, ct);

        if (image != null)
        {
            try
            {
                await imageStorage.DeleteAsync(image.ExternalId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error al eliminar imagen {ExternalId} de Cloudinary tras eliminar banner de bodega", image.ExternalId);
            }
        }
    }

    public async Task<Guid> UploadVintageImageAsync(int wineId, int vintageId, IFormFile file, Actor actor, CancellationToken ct = default)
    {
        var (ext, mime) = ImageValidator.Validate(file);

        var wine = await wineRepository.GetByIdAsync(wineId, ct)
            ?? throw new NotFoundException($"Vino con ID {wineId} no encontrado.");

        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct)
            ?? throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada.");

        if (vintage.WineId != wineId)
        {
            throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada para el vino {wineId}.");
        }

        await AuthorizeVintageModificationAsync(wine, vintage, actor, ct);

        var newImageId = Guid.NewGuid();
        using var stream = file.OpenReadStream();
        var uploadResult = await imageStorage.UploadAsync(newImageId, stream, mime, ImageType.WineVintage, ct);

        var oldImageId = vintage.ImageId;

        try
        {
            var imageRecord = new Image
            {
                Id = newImageId,
                Provider = "cloudinary",
                ExternalId = uploadResult.ExternalId,
                MimeType = mime,
                SizeBytes = uploadResult.SizeBytes,
                Width = uploadResult.Width,
                Height = uploadResult.Height,
                CreatedAt = DateTime.UtcNow
            };

            await transactionRunner.AttachVintageImageAsync(imageRecord, vintageId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fallo en transacción DB al actualizar imagen de cosecha {VintageId}. Compensando borrado en Cloudinary para {ExternalId}", vintageId, uploadResult.ExternalId);
            try
            {
                await imageStorage.DeleteAsync(uploadResult.ExternalId, ct);
            }
            catch (Exception compEx)
            {
                logger.LogError(compEx, "Fallo al compensar borrado en Cloudinary para {ExternalId}", uploadResult.ExternalId);
            }
            throw;
        }

        if (oldImageId.HasValue)
        {
            await BestEffortDeleteImageAsync(oldImageId.Value, ct);
        }

        return newImageId;
    }

    public async Task DeleteVintageImageAsync(int wineId, int vintageId, Actor actor, CancellationToken ct = default)
    {
        var wine = await wineRepository.GetByIdAsync(wineId, ct)
            ?? throw new NotFoundException($"Vino con ID {wineId} no encontrado.");

        var vintage = await vintageRepository.GetByIdAsync(vintageId, ct)
            ?? throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada.");

        if (vintage.WineId != wineId)
        {
            throw new NotFoundException($"Cosecha con ID {vintageId} no encontrada para el vino {wineId}.");
        }

        await AuthorizeVintageModificationAsync(wine, vintage, actor, ct);

        if (!vintage.ImageId.HasValue)
        {
            return;
        }

        var imageId = vintage.ImageId.Value;
        var image = await imageRepository.GetByIdAsync(imageId, ct);

        await transactionRunner.DetachAndDeleteVintageImageAsync(vintageId, imageId, ct);

        if (image != null)
        {
            try
            {
                await imageStorage.DeleteAsync(image.ExternalId, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error al eliminar imagen {ExternalId} de Cloudinary tras eliminar imagen de cosecha", image.ExternalId);
            }
        }
    }

    private async Task AuthorizeVintageModificationAsync(Wine wine, WineVintage vintage, Actor actor, CancellationToken ct)
    {
        if (actor.IsAdmin)
        {
            return;
        }

        var isUploader = vintage.UploadedByUserId == actor.UserId;
        if (isUploader && vintage.ApprovalStatus == ApprovalStatus.Pending)
        {
            return;
        }

        Winery? winery = null;
        if (wine.WineryId is int wid)
        {
            winery = await wineryRepository.GetByIdAsync(wid, ct);
        }

        if (!WineryAccessRules.IsOwner(winery, actor))
        {
            throw new ForbiddenException(isUploader
                ? "No podés editar una cosecha que ya fue moderada."
                : "No tenés permiso para editar esta cosecha.");
        }

        if (!WineryAccessRules.CanPublish(winery, actor))
        {
            throw new ForbiddenException("La bodega debe estar aprobada o pendiente para editar cosechas.");
        }
    }

    private async Task BestEffortDeleteImageAsync(Guid imageId, CancellationToken ct)
    {
        try
        {
            var oldImage = await imageRepository.GetByIdAsync(imageId, ct);
            if (oldImage != null)
            {
                await imageRepository.DeleteAsync(oldImage.Id, ct);
                await imageStorage.DeleteAsync(oldImage.ExternalId, ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error al eliminar imagen previa {OldImageId} tras reemplazo", imageId);
        }
    }
}
