using System.Security.Claims;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Tastings.DTOs;
using AyVino.Api.Features.Tastings.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Tastings.Endpoints;

public static class TastingEndpoints
{
    public static IEndpointRouteBuilder MapTastingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users/me/tastings")
            .WithTags("Tastings")
            .RequireAuthorization();

        group.MapGet("/", async (
            ClaimsPrincipal user,
            ITastingService service,
            CancellationToken ct,
            int pageNumber = 1,
            int pageSize = 10,
            int? wineVintageId = null) =>
        {
            var userId = user.GetUserId();
            var tastings = await service.GetPagedByUserIdAsync(userId, pageNumber, pageSize, wineVintageId, ct);
            return Results.Ok(tastings);
        })
        .WithName("GetMyTastings")
        .WithSummary("Lista las catas privadas del usuario actual ordenadas por fecha más reciente.");

        group.MapPost("/", async (
            CreateTastingRequestDto request,
            ClaimsPrincipal user,
            ITastingService service,
            CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var created = await service.CreateAsync(userId, request, ct);
            return Results.Created($"/api/users/me/tastings/{created.Id}", created);
        })
        .WithName("CreateTasting")
        .WithSummary("Registra una cata privada de un vino o cosecha puntual.");

        // Ruta alternativa directa /api/tastings para creación
        app.MapPost("/api/tastings", async (
            CreateTastingRequestDto request,
            ClaimsPrincipal user,
            ITastingService service,
            CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var created = await service.CreateAsync(userId, request, ct);
            return Results.Created($"/api/users/me/tastings/{created.Id}", created);
        })
        .RequireAuthorization()
        .WithTags("Tastings")
        .WithName("CreateTastingDirect")
        .WithSummary("Registra una cata privada (ruta alternativa).");

        return app;
    }
}
