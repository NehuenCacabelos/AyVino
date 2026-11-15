namespace AyVino.Api.Features.Images.Models;

public class Image
{
    public Guid Id { get; init; }
    public string Provider { get; init; } = "cloudinary";
    public string ExternalId { get; init; } = string.Empty;
    public string MimeType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public int? Width { get; init; }
    public int? Height { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
