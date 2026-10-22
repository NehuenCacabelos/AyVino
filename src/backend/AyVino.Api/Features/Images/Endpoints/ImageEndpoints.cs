using AyVino.Api.Features.Images.DTOs;
using AyVino.Api.Features.Images.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AyVino.Api.Features.Images.Endpoints;

public static class ImageEndpoints
{
    public static IEndpointRouteBuilder MapImageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/images").WithTags("Images");

        group.MapPost("/", async (
            [FromForm] IFormFile? file,
            [FromForm] string? folder,
            IImageStorage storage,
            CancellationToken ct) =>
        {
            var (extension, canonicalContentType) = ImageValidator.Validate(file, folder);

            var fileName = $"{Guid.NewGuid():N}{extension}";

            using var stream = file!.OpenReadStream();
            var publicUrl = await storage.UploadAsync(stream, fileName, canonicalContentType, folder!.Trim().ToLowerInvariant(), ct);

            return Results.Created(publicUrl, new ImageUploadResponseDto(publicUrl));
        })
        .DisableAntiforgery()
        .RequireAuthorization()
        .WithName("UploadImage")
        .WithSummary("Sube una imagen (JPG, PNG, WEBP, máx 2 MB) a la carpeta especificada de Supabase Storage.");

        return app;
    }
}

