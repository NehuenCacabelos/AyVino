using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Images.Configuration;
using AyVino.Api.Features.Images.Models;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Images.Services;

public class CloudinaryImageStorage : IImageStorage
{
    public const string VariantAvatar = "avatar";
    public const string VariantLogo = "logo";
    public const string VariantBanner = "banner";
    public const string VariantBottle = "bottle";

    public static readonly HashSet<string> AllowedVariants = new(StringComparer.OrdinalIgnoreCase)
    {
        VariantAvatar,
        VariantLogo,
        VariantBanner,
        VariantBottle
    };

    private readonly ICloudinaryClient _cloudinaryClient;
    private readonly CloudinaryOptions _options;
    private readonly ILogger<CloudinaryImageStorage> _logger;

    public CloudinaryImageStorage(
        ICloudinaryClient cloudinaryClient,
        CloudinaryOptions options,
        ILogger<CloudinaryImageStorage> logger)
    {
        _cloudinaryClient = cloudinaryClient;
        _options = options;
        _logger = logger;
    }

    public async Task<StoredImageResult> UploadAsync(
        Guid id,
        Stream stream,
        string contentType,
        ImageType imageType,
        CancellationToken ct = default)
    {
        var publicId = id.ToString("D");
        var assetFolder = GetAssetFolder(imageType);

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(publicId, stream),
            PublicId = publicId,
            AssetFolder = assetFolder,
            Overwrite = false,
            UseFilename = false,
            UniqueFilename = false
        };

        _logger.LogInformation("Subiendo imagen a Cloudinary. PublicId={PublicId}, AssetFolder={AssetFolder}", publicId, assetFolder);

        var result = await _cloudinaryClient.UploadAsync(uploadParams, ct);

        _logger.LogInformation("Imagen subida exitosamente a Cloudinary. ExternalId={ExternalId}", result.ExternalId);

        return result;
    }

    public async Task<bool> DeleteAsync(string externalId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return false;
        }

        try
        {
            var deletionParams = new DeletionParams(externalId)
            {
                Invalidate = true
            };

            var result = await _cloudinaryClient.DestroyAsync(deletionParams);
            return string.Equals(result.Result, "ok", StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al intentar eliminar la imagen con ExternalId={ExternalId} de Cloudinary", externalId);
            return false;
        }
    }

    public string BuildDeliveryUrl(string externalId, string? variant = null)
    {
        if (string.IsNullOrWhiteSpace(externalId))
        {
            throw new ArgumentException("El identificador de la imagen no puede estar vacío.", nameof(externalId));
        }

        if (!string.IsNullOrWhiteSpace(variant) && !AllowedVariants.Contains(variant.Trim()))
        {
            throw new ValidationException($"Variante de imagen '{variant}' desconocida.");
        }

        var normalizedVariant = variant?.Trim().ToLowerInvariant();

        Transformation transformation = normalizedVariant switch
        {
            VariantAvatar => new Transformation()
                .Width(256)
                .Height(256)
                .Crop("thumb")
                .Gravity("face")
                .FetchFormat("auto")
                .Quality("auto"),

            VariantLogo => new Transformation()
                .Width(400)
                .Height(400)
                .Crop("pad")
                .Background("transparent")
                .FetchFormat("auto")
                .Quality("auto"),

            VariantBanner => new Transformation()
                .Width(1920)
                .Height(640)
                .Crop("fill")
                .Gravity("auto")
                .FetchFormat("auto")
                .Quality("auto"),

            VariantBottle => new Transformation()
                .Width(600)
                .Height(1200)
                .Crop("pad")
                .Background("transparent")
                .FetchFormat("auto")
                .Quality("auto"),

            _ => new Transformation()
                .FetchFormat("auto")
                .Quality("auto")
        };

        return _cloudinaryClient.BuildUrl(externalId, transformation);
    }

    private string GetAssetFolder(ImageType imageType)
    {
        var typeFolder = imageType switch
        {
            ImageType.Avatar => "avatares",
            ImageType.WineryLogo => "logos-bodega",
            ImageType.WineryBanner => "banners-bodega",
            ImageType.WineVintage => "cosechas",
            _ => throw new ArgumentOutOfRangeException(nameof(imageType), imageType, "Tipo de imagen no soportado.")
        };

        var env = _options.Environment.Trim().ToLowerInvariant();
        return $"{env}/{typeFolder}";
    }
}
