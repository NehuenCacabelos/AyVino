using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.WineryCatalog.Services;

namespace AyVino.Api.Features.WineryCatalog.Endpoints;

public static class WineryCatalogEndpoints
{
    public static IEndpointRouteBuilder MapWineryCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wineries").WithTags("Winery Catalog");

        group.MapGet("/me/catalog", async (ClaimsPrincipal user, IWineryCatalogService service, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            var catalog = await service.GetMyCatalogAsync(actor.UserId, ct);
            return Results.Ok(catalog);
        })
        .RequireAuthorization(AppPolicies.RequireWinery)
        .WithName("GetMyWineryCatalog")
        .WithSummary("Devuelve el catálogo integral de la bodega del productor autenticado, con añadas, uvas y métricas de resumen.");

        return app;
    }
}
