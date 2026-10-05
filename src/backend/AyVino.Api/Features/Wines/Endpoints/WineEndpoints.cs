using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Services;

namespace AyVino.Api.Features.Wines.Endpoints;

public static class WineEndpoints
{
    public static IEndpointRouteBuilder MapWineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines");

        group.MapGet("/", async (int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, ct)))
            .WithName("GetAllWines")
            .WithSummary("Lists wine labels, paginated. Year/grape filters match against any of the label's vintages.");

        group.MapGet("/{id:int}", async (int id, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct)))
            .WithName("GetWineById")
            .WithSummary("Gets a wine label with its overall rating. See /vintages for the per-year breakdown.");

        group.MapPost("/", async (CreateWineRequestDto request, IWineService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/wines/{created.Id}", created);
        })
            .RequireAuthorization()
            .WithName("CreateWine")
            .WithSummary("Creates a new wine label together with its first vintage.");

        group.MapPut("/{id:int}", async (int id, UpdateWineRequestDto request, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct)))
            .RequireAuthorization()
            .WithName("UpdateWine")
            .WithSummary("Updates a wine label's data (name, type, winery, location, description).");

        group.MapDelete("/{id:int}", async (int id, IWineService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("DeleteWine")
            .WithSummary("Deletes a wine label and all of its vintages (cascade).");

        group.MapGet("/claim-candidates/{wineryId:int}", async (int wineryId, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetClaimCandidatesAsync(wineryId, ct)))
            .RequireAuthorization()
            .WithName("GetWineClaimCandidates")
            .WithSummary("Lists unclaimed community wine labels whose typed winery name matches this winery.");

        group.MapPost("/claim/{wineryId:int}", async (int wineryId, ClaimWinesRequestDto request, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.ClaimWinesAsync(wineryId, request.WineIds, ct)))
            .RequireAuthorization()
            .WithName("ClaimWines")
            .WithSummary("Links unclaimed community wine labels to a registered winery.");

        group.MapGet("/search", async (string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.SearchAsync(name, winery, year, wineType, pageNumber, pageSize, ct)))
            .WithName("SearchWines")
            .WithSummary("Busca vinos por nombre, bodega, año y/o tipo — reemplaza el escaneo de etiqueta en la versión web.");

        

        return app;
    }
}