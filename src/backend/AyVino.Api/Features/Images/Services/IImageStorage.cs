using AyVino.Api.Features.Images.Models;

namespace AyVino.Api.Features.Images.Services;

public interface IImageStorage
{
    Task<StoredImageResult> UploadAsync(
        Guid id,
        Stream stream,
        string contentType,
        ImageType imageType,
        CancellationToken ct = default);

    Task<bool> DeleteAsync(string externalId, CancellationToken ct = default);

    string BuildDeliveryUrl(string externalId, string? variant = null);
}
