using AyVino.Api.Features.Images.Models;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace AyVino.Api.Features.Images.Services;

public interface ICloudinaryClient
{
    Task<StoredImageResult> UploadAsync(ImageUploadParams uploadParams, CancellationToken ct = default);
    Task<DeletionResult> DestroyAsync(DeletionParams deletionParams);
    string BuildUrl(string externalId, Transformation? transformation = null);
}
