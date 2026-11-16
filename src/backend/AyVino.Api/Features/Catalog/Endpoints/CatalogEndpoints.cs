using AyVino.Api.Features.Catalog.Services;

namespace AyVino.Api.Features.Catalog.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var catalogGroup = app.MapGroup("/api/catalog")
            .WithTags("Catalog");

        catalogGroup.MapGet("/filters", async (ICatalogService service, CancellationToken ct) =>
            Results.Ok(await service.GetFiltersAsync(ct)))
            .AllowAnonymous()
            .WithName("GetCatalogFilters")
            .WithSummary("Obtiene los filtros de uvas, provincias y bodegas con cantidad de vinos visibles.");

        var searchGroup = app.MapGroup("/api/search")
            .WithTags("Search");

        searchGroup.MapGet("/suggestions", async (
            string? q,
            int? grapeId,
            int? stateId,
            int? wineryId,
            ICatalogService service,
            CancellationToken ct) =>
            Results.Ok(await service.GetSuggestionsAsync(q, grapeId, stateId, wineryId, ct)))
            .AllowAnonymous()
            .WithName("GetSearchSuggestions")
            .WithSummary("Devuelve sugerencias agrupadas de vinos, bodegas, uvas y regiones.");

        return app;
    }
}
