using AyVino.Api.Features.Catalog.Services;

namespace AyVino.Api.Features.Catalog.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/catalog").WithTags("Catalog");

        group.MapGet("/showcase", async (
            ICatalogService service,
            CancellationToken ct,
            string? q = null,
            string? wineType = null,
            int? grapeId = null,
            int? locationId = null,
            int pageNumber = 1,
            int pageSize = 6,
            int winesPerWinery = 8) =>
        {
            var result = await service.GetShowcaseAsync(
                q, wineType, grapeId, locationId, pageNumber, pageSize, winesPerWinery, ct);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("GetCatalogShowcase")
        .WithSummary("Devuelve bodegas paginadas con sus vinos visibles agrupados para el catálogo general.");

        group.MapGet("/filters", async (ICatalogService service, CancellationToken ct) =>
        {
            var result = await service.GetFiltersAsync(ct);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("GetCatalogFilters")
        .WithSummary("Devuelve las opciones disponibles de varietales, regiones y bodegas presentes en datos visibles.");

        return app;
    }
}
