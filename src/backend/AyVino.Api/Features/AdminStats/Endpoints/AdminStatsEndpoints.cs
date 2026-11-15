using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.AdminStats.Services;

namespace AyVino.Api.Features.AdminStats.Endpoints;

public static class AdminStatsEndpoints
{
    public static IEndpointRouteBuilder MapAdminStatsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/stats").WithTags("AdminStats");

        group.MapGet("/", async (ClaimsPrincipal user, IAdminStatsService service, CancellationToken ct) =>
            Results.Ok(await service.GetStatsAsync(user.GetActor(), ct)))
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("GetAdminStats")
            .WithSummary("Retorna métricas y conteos exactos de moderación y catálogos para el dashboard de administración.");

        return app;
    }
}
