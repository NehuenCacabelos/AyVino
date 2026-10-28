using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Services;

namespace AyVino.Api.Features.Wines.Endpoints;

public static class WineEndpoints
{
    public static IEndpointRouteBuilder MapWineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines");

        group.MapGet("/", async (int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, ClaimsPrincipal? user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, user.GetActorOrNull(), ct)))
            .WithName("GetAllWines")
            .WithSummary("Lists wine labels, paginated. Year/grape filters match against any of the label's vintages.");

        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal? user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, user.GetActorOrNull(), ct)))
            .WithName("GetWineById")
            .WithSummary("Gets a wine label with its overall rating. See /vintages for the per-year breakdown.");

        group.MapPost("/", async (CreateWineRequestDto request, ClaimsPrincipal user, IWineService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, user.GetActor(), ct);
            return Results.Created($"/api/wines/{created.Id}", created);
        })
            .RequireAuthorization()
            .WithName("CreateWine")
            .WithSummary("Creates a new wine label together with its first vintage.");

        group.MapPut("/{id:int}", async (int id, UpdateWineRequestDto request, ClaimsPrincipal user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, user.GetActor(), ct)))
            .RequireAuthorization()
            .WithName("UpdateWine")
            .WithSummary("Updates a wine label's data (name, type, winery, location, description).")
            .WithAudit(AuditAction.WineUpdatedByAdmin, "Wine", idRouteKey: "id", adminOnly: true, details: (ctx, res) => ctx.Arguments.OfType<UpdateWineRequestDto>().FirstOrDefault()?.Name);

        group.MapDelete("/{id:int}", async (int id, IWineService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("DeleteWine")
            .WithSummary("Deletes a wine label and all of its vintages (cascade).")
            .WithAudit(AuditAction.WineDeleted, "Wine", idRouteKey: "id");

        group.MapGet("/claim-candidates/{wineryId:int}", async (int wineryId, ClaimsPrincipal user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetClaimCandidatesAsync(wineryId, user.GetActor(), ct)))
            .RequireAuthorization()
            .WithName("GetWineClaimCandidates")
            .WithSummary("Lists unclaimed community wine labels whose typed winery name matches this winery.");

        group.MapPost("/claim/{wineryId:int}", async (int wineryId, ClaimWinesRequestDto request, ClaimsPrincipal user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.ClaimWinesAsync(wineryId, request.WineIds, user.GetActor(), ct)))
            .RequireAuthorization()
            .WithName("ClaimWines")
            .WithSummary("Links unclaimed community wine labels to a registered winery.");

        group.MapGet("/search", async (string? name, string? winery, int? year, string? wineType, int pageNumber, int pageSize, ClaimsPrincipal? user, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.SearchAsync(name, winery, year, wineType, pageNumber, pageSize, user.GetActorOrNull(), ct)))
            .WithName("SearchWines")
            .WithSummary("Busca vinos por nombre, bodega, año y/o tipo — reemplaza el escaneo de etiqueta en la versión web.");

        return app;
    }
}
