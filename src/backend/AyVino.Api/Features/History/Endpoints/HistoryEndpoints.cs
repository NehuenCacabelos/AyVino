using System.Security.Claims;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Services;
using Microsoft.AspNetCore.Mvc;

namespace AyVino.Api.Features.History.Endpoints;

public static class HistoryEndpoints
{
    public static IEndpointRouteBuilder MapHistoryEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/users/me/history", async (
            ClaimsPrincipal user,
            IHistoryService historyService,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? type = null,
            CancellationToken ct = default) =>
        {
            var userId = user.GetUserId();
            var history = await historyService.GetUserHistoryAsync(userId, pageNumber, pageSize, type, ct);
            return Results.Ok(history);
        })
        .RequireAuthorization()
        .WithTags("Users profile")
        .WithName("GetUserHistory")
        .WithSummary("Obtiene el historial de actividades del usuario autenticado");

        return app;
    }
}
