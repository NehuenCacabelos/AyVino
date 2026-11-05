using AyVino.Api.Features.Images.Models;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace AyVino.Api.Features.Images.Services;

public class CloudinaryClientWrapper(Cloudinary cloudinary) : ICloudinaryClient
{
    public async Task<StoredImageResult> UploadAsync(ImageUploadParams uploadParams, CancellationToken ct = default)
    {
        var result = await cloudinary.UploadAsync(uploadParams, ct);
        if (result.Error != null)
        {
            throw new InvalidOperationException($"Error de Cloudinary al subir imagen: {result.Error.Message}");
        }

        return new StoredImageResult(
            result.PublicId,
            result.Width > 0 ? result.Width : null,
            result.Height > 0 ? result.Height : null,
            result.Bytes
        );
    }

    public async Task<DeletionResult> DestroyAsync(DeletionParams deletionParams)
    {
        return await cloudinary.DestroyAsync(deletionParams);
    }

    public string BuildUrl(string externalId, Transformation? transformation = null)
    {
        var builder = cloudinary.Api.UrlImgUp.Secure(true);
        if (transformation != null)
        {
            builder = builder.Transform(transformation);
        }
        return builder.BuildUrl(externalId);
    }
}
