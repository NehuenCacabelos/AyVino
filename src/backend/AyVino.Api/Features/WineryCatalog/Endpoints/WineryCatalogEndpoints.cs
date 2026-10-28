using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.WineryCatalog.Models;
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

        group.MapGet("/{id:int}/public", async (int id, ClaimsPrincipal? user, IWineryCatalogService service, CancellationToken ct) =>
        {
            var actor = user.GetActorOrNull();
            var profile = await service.GetPublicProfileAsync(id, actor, ct);
            return Results.Ok(profile);
        })
        .AllowAnonymous()
        .WithName("GetWineryPublicProfile")
        .WithSummary("Devuelve el perfil público de una bodega con seguidores, totales y valoración agregada.");

        group.MapGet("/{id:int}/catalog", async (
            int id,
            ClaimsPrincipal? user,
            IWineryCatalogService service,
            CancellationToken ct,
            int pageNumber = 1,
            int pageSize = 12,
            string? search = null,
            string? wineType = null,
            int? grapeId = null,
            int? year = null,
            string? sort = "name") =>
        {
            var actor = user.GetActorOrNull();
            var query = new WineryPublicCatalogQueryParams(pageNumber, pageSize, search, wineType, grapeId, year, sort);
            var catalog = await service.GetPublicCatalogAsync(id, actor, query, ct);
            return Results.Ok(catalog);
        })
        .AllowAnonymous()
        .WithName("GetWineryPublicCatalog")
        .WithSummary("Devuelve el catálogo público paginado de una bodega con filtros del servidor, añadas y uvas.");

        return app;
    }
}
