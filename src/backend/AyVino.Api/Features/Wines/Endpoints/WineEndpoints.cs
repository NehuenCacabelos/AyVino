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
            .WithSummary("Lists wines, paginated, with optional winery, grape and year-range filters.");

        group.MapGet("/{id:int}", async (int id, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct)))
            .WithName("GetWineById")
            .WithSummary("Gets a wine by ID, including its grape blend.");

        group.MapPost("/", async (CreateWineRequestDto request, IWineService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/wines/{created.Id}", created);
        })
            .WithName("CreateWine")
            .WithSummary("Creates a wine (starts as Pending) with its optional grape blend.");

        group.MapPut("/{id:int}", async (int id, UpdateWineRequestDto request, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct)))
            .WithName("UpdateWine")
            .WithSummary("Updates a wine's data and replaces its grape blend.");

        group.MapPut("/{id:int}/status", async (int id, string status, IWineService service, CancellationToken ct) =>
            Results.Ok(await service.ChangeStatusAsync(id, status, ct)))
            .WithName("ChangeWineStatus")
            .WithSummary("Changes a wine's moderation status (Pending/Approved/Rejected).");

        group.MapDelete("/{id:int}", async (int id, IWineService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .WithName("DeleteWine")
            .WithSummary("Deletes a wine.");

        return app;
    }
}