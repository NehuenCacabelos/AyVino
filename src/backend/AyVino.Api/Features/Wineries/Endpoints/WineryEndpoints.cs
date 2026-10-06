using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Services;

namespace AyVino.Api.Features.Wineries.Endpoints;

public static class WineryEndpoints
{
    public static IEndpointRouteBuilder MapWineryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wineries").WithTags("Wineries");

        group.MapGet("/", async (int pageNumber, int pageSize, string? status, int? locationId, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, status, locationId, ct)))
            .WithName("GetAllWineries")
            .WithSummary("Lists wineries, paginated, with optional status and location filters.");

        group.MapGet("/{id:int}", async (int id, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct)))
            .WithName("GetWineryById")
            .WithSummary("Gets a winery by ID.");

        group.MapPost("/", async (CreateWineryRequestDto request, IWineryService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/wineries/{created.Id}", created);
        })
            .RequireAuthorization()
            .WithName("CreateWinery")
            .WithSummary("Creates a winery with no owner assigned (starts as Pending, UserId null).");

        group.MapPost("/register", async (RegisterWineryRequestDto request, IWineryService service, CancellationToken ct) =>
        {
            var created = await service.RegisterWineryAsync(request, ct);
            return Results.Created($"/api/wineries/{created.Winery.Id}", created);
        })
            .AllowAnonymous()
            .WithName("RegisterWinery")
            .WithSummary("Creates a User (Role=Winery) and its associated Winery in a single flow, returns a JWT.");

        group.MapPut("/{id:int}", async (int id, UpdateWineryRequestDto request, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct)))
            .RequireAuthorization()
            .WithName("UpdateWinery")
            .WithSummary("Updates an existing winery's data.");

        group.MapPatch("/{id:int}/status", async (int id, ChangeWineryStatusRequestDto request, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.ChangeStatusAsync(id, request, ct)))
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("ChangeWineryStatus")
            .WithSummary("Changes a winery's moderation status (Pending/Approved/Rejected).");

        group.MapDelete("/{id:int}", async (int id, IWineryService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("DeleteWinery")
            .WithSummary("Deletes a winery.");

        return app;
    }
}