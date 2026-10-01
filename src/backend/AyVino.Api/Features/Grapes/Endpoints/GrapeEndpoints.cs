using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Services;

namespace AyVino.Api.Features.Grapes.Endpoints;

public static class GrapeEndpoints
{
    public static IEndpointRouteBuilder MapGrapeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/grapes").WithTags("Grapes");

        group.MapPost("/", async (CreateGrapeRequestDto request, IGrapeService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/grapes/{created.Id}", created);
        })
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("CreateGrape")
        .WithSummary("Creates a new grape.");

        group.MapGet("/", async (IGrapeService service, int pageNumber = 1, int pageSize = 10, string? colorType = null, CancellationToken ct = default) =>
        {
            var grapes = await service.GetAllAsync(pageNumber, pageSize, colorType, ct);
            return Results.Ok(grapes);
        }).WithName("GetGrapes").WithSummary("Lists paginated grapes, with optional filter by color type.");

        group.MapGet("/{id:int}", async (int id, IGrapeService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct))
        ).WithName("GetGrapeById").WithSummary("Gets a grape by Id.");

        group.MapPut("/{id:int}", async (int id, UpdateGrapeRequestDto request, IGrapeService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct))
        )
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("UpdateGrape")
        .WithSummary("Updates an existing grape.");

        group.MapDelete("/{id:int}", async (int id, IGrapeService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("DeleteGrape")
        .WithSummary("Deletes a grape.");

        return app;
    }
}