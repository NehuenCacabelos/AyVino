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
    public const string VariantCard = "card";
    public const string VariantDetail = "detail";
    public const string VariantThumb = "thumb";

    /// <summary>
    /// Transformación para tarjetas de vinos (catálogo, dashboard, cava):
    /// - e_trim:10 -> Recorta márgenes vacíos uniformes del borde de la foto original (tolerancia 10).
    /// - c_fit,w_680,h_880 -> Ajusta proporcionalmente la botella al área interior útil sin recortar píxeles.
    /// - c_pad,w_800,h_1000,b_white -> Genera un lienzo fijo de proporción 4:5 centrado con fondo blanco uniforme (#ffffff).
    /// - f_auto,q_auto -> Auto-formato (webp/avif) y compresión inteligente en CDN.
    /// </summary>
    public const string TransformCard = "e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto";

    /// <summary>
    /// Transformación para vista de detalle de vinos (ficha técnica y fotos principales):
    /// - e_trim:10 -> Recorta márgenes vacíos uniformes del borde de la foto original (tolerancia 10).
    /// - c_fit,w_1020,h_1320 -> Escala la botella en alta resolución para llenar el cuadro escénico.
    /// - c_pad,w_1200,h_1500,b_white -> Genera un lienzo fijo de proporción 4:5 centrado con fondo blanco uniforme (#ffffff).
    /// - f_auto,q_auto -> Auto-formato (webp/avif) y compresión inteligente en CDN.
    /// </summary>
    public const string TransformDetail = "e_trim:10/c_fit,w_1020,h_1320/c_pad,w_1200,h_1500,b_white/f_auto,q_auto";

    /// <summary>
    /// Transformación para miniaturas de vinos (buscador, historial de perfil, bitácora y listas chicas):
    /// - e_trim:10 -> Recorta márgenes vacíos uniformes del borde de la foto original (tolerancia 10).
    /// - c_fit,w_136,h_176 -> Ajusta la botella proporcionalmente a la miniatura compacta.
    /// - c_pad,w_160,h_200,b_white -> Genera un lienzo fijo de proporción 4:5 centrado con fondo blanco uniforme (#ffffff).
    /// - f_auto,q_auto -> Auto-formato (webp/avif) y compresión inteligente en CDN.
    /// </summary>
    public const string TransformThumb = "e_trim:10/c_fit,w_136,h_176/c_pad,w_160,h_200,b_white/f_auto,q_auto";

    public static readonly HashSet<string> AllowedVariants = new(StringComparer.OrdinalIgnoreCase)
    {
        VariantAvatar,
        VariantLogo,
        VariantBanner,
        VariantCard,
        VariantDetail,
        VariantThumb
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
            return string.Empty;
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

            VariantDetail => new Transformation().RawTransformation(TransformDetail),
            VariantThumb => new Transformation().RawTransformation(TransformThumb),
            VariantCard => new Transformation().RawTransformation(TransformCard),

            // Variante desconocida, ausente o legacy cae en card
            _ => new Transformation().RawTransformation(TransformCard)
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
