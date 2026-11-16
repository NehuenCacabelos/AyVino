using System.Security.Claims;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Uncorks.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Uncorks.Endpoints;

public static class UncorkEndpoints
{
    public static IEndpointRouteBuilder MapUncorkEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users/me/uncorks")
            .WithTags("Uncorks")
            .RequireAuthorization();

        group.MapGet("/", async (
            ClaimsPrincipal user,
            IUncorkService service,
            CancellationToken ct,
            int pageNumber = 1,
            int pageSize = 10,
            int? wineVintageId = null) =>
        {
            var userId = user.GetUserId();
            var uncorks = await service.GetPagedByUserIdAsync(userId, pageNumber, pageSize, wineVintageId, ct);
            return Results.Ok(uncorks);
        })
        .WithName("GetMyUncorks")
        .WithSummary("Lista los descorches del usuario actual ordenados por fecha más reciente.");

        group.MapPost("/", async (
            CreateUncorkRequestDto request,
            ClaimsPrincipal user,
            IUncorkService service,
            CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var created = await service.CreateAsync(userId, request, ct);
            return Results.Created($"/api/users/me/uncorks/{created.Id}", created);
        })
        .WithName("CreateUncork")
        .WithSummary("Registra un evento de descorche para el usuario autenticado (sin cava asociada).");

        return app;
    }
}
