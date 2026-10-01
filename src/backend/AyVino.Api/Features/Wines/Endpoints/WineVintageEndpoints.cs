using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Services;

namespace AyVino.Api.Features.Wines.Endpoints;

public static class WineVintageEndpoints
{
    public static IEndpointRouteBuilder MapWineVintageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wines/{wineId:int}/vintages").WithTags("Wine Vintages");

        group.MapGet("/", async (int wineId, IWineVintageService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllByWineIdAsync(wineId, ct)))
            .WithName("GetWineVintages")
            .WithSummary("Lists all vintages of a wine label with their own rating (the 'other vintages' list, like Vivino).");

        group.MapGet("/{vintageId:int}", async (int wineId, int vintageId, IWineVintageService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(wineId, vintageId, ct)))
            .WithName("GetWineVintageById")
            .WithSummary("Gets a single vintage with its grape blend and rating.");

        group.MapPost("/", async (int wineId, CreateWineVintageRequestDto request, IWineVintageService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(wineId, request, ct);
            return Results.Created($"/api/wines/{wineId}/vintages/{created.Id}", created);
        })
            .RequireAuthorization()
            .WithName("CreateWineVintage")
            .WithSummary("Adds a new vintage (starts as Pending) to an existing wine label.");

        group.MapPut("/{vintageId:int}", async (int wineId, int vintageId, UpdateWineVintageRequestDto request, IWineVintageService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(wineId, vintageId, request, ct)))
            .RequireAuthorization()
            .WithName("UpdateWineVintage")
            .WithSummary("Updates a vintage's data and replaces its grape blend.");

        group.MapPatch("/{vintageId:int}/status", async (int wineId, int vintageId, ChangeWineVintageStatusRequestDto request, IWineVintageService service, CancellationToken ct) =>
            Results.Ok(await service.ChangeStatusAsync(wineId, vintageId, request, ct)))
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("ChangeWineVintageStatus")
            .WithSummary("Changes a vintage's moderation status (Pending/Approved/Rejected).");

        group.MapDelete("/{vintageId:int}", async (int wineId, int vintageId, IWineVintageService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(wineId, vintageId, ct);
            return Results.NoContent();
        })
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("DeleteWineVintage")
            .WithSummary("Deletes a single vintage.");

        return app;
    }
}