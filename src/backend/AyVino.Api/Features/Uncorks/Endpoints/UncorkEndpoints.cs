using System.Security.Claims;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Uncorks.Services;

namespace AyVino.Api.Features.Uncorks.Endpoints;

public static class UncorkEndpoints
{
    public static IEndpointRouteBuilder MapUncorkEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/uncorks", async (
            UncorkRequestDto request,
            ClaimsPrincipal user,
            IUncorkService uncorkService,
            CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var response = await uncorkService.UncorkAsync(userId, request, ct);
            return Results.Created($"/api/uncorks/{response.ActivityId}", response);
        })
        .RequireAuthorization()
        .WithTags("Uncorks")
        .WithName("UncorkWine")
        .WithSummary("Descorcha un vino (opcionalmente descontando de la cava, puntuando y reseñando)");

        return app;
    }
}
