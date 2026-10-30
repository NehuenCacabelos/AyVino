using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Images.Endpoints;

public static class ImageEndpoints
{
    private static readonly HashSet<string> AllowedVariants = new(StringComparer.OrdinalIgnoreCase)
    {
        "avatar",
        "logo",
        "banner",
        "bottle"
    };

    public static IEndpointRouteBuilder MapImageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/images")
                       .WithTags("Images");

        group.MapGet("/{id:guid}", GetImageByIdAsync)
             .AllowAnonymous()
             .WithName("GetImageById")
             .WithSummary("Obtiene una imagen por ID y redirige a la URL de entrega en Cloudinary");

        return app;
    }

    public static async Task<IResult> GetImageByIdAsync(
        Guid id,
        string? variant,
        IImageRepository imageRepository,
        IImageStorage imageStorage,
        HttpContext httpContext,
        CancellationToken ct)
    {
        string? cleanVariant = null;
        if (!string.IsNullOrWhiteSpace(variant))
        {
            var trimmed = variant.Trim();
            if (!AllowedVariants.Contains(trimmed))
            {
                throw new ValidationException($"Variante '{variant}' no válida. Valores permitidos: avatar, logo, banner, bottle.");
            }
            cleanVariant = trimmed.ToLowerInvariant();
        }

        var image = await imageRepository.GetByIdAsync(id, ct);
        if (image == null)
        {
            throw new NotFoundException($"Imagen con ID '{id}' no encontrada.");
        }

        var deliveryUrl = imageStorage.BuildDeliveryUrl(image.ExternalId, cleanVariant);
        httpContext.Response.Headers.CacheControl = "public, max-age=604800";
        return Results.Redirect(deliveryUrl, permanent: false);
    }
}
