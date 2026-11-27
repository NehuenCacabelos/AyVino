namespace AyVino.Api.Features.Images.Models;

public record StoredImageResult(
    string ExternalId,
    int? Width,
    int? Height,
    long SizeBytes
);
