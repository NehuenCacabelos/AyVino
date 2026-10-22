namespace AyVino.Api.Features.Images.Services;

public interface IImageStorage
{
    bool IsConfigured { get; }
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, string folder, CancellationToken ct = default);
    bool IsUrlFromStorage(string url);
}

