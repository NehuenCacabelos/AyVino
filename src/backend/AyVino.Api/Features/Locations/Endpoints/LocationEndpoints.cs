using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Locations.Endpoints;

public static class LocationEndpoints
{
    public static IEndpointRouteBuilder MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/locations")
                       .WithTags("Locations");

        group.MapPost("/", async (CreateLocationRequestDto request, ILocationService locationService, CancellationToken ct) =>
        {
            var created = await locationService.CreateAsync(request, ct);
            return Results.Created($"/api/locations/{created.Id}", created);
        })
        .WithName("CreateLocation")
        .WithSummary("Creates a new location");

        group.MapGet("/", async (int pageNumber, int pageSize, string? country, ILocationService locationService, CancellationToken ct) =>
        {
            var locations = await locationService.GetAllAsync(pageNumber, pageSize, country, ct);
            return Results.Ok(locations);
        })
        .WithName("GetAllLocations")
        .WithSummary("Gets a paginated list of locations, with optional country filter");

        group.MapGet("/{id:int}", async (int id, ILocationService locationService, CancellationToken ct) =>
        {
            var location = await locationService.GetByIdAsync(id, ct);
            return Results.Ok(location);
        })
        .WithName("GetLocationById")
        .WithSummary("Gets a location by its ID");

        group.MapPut("/{id:int}", async (int id, UpdateLocationRequestDto request, ILocationService locationService, CancellationToken ct) =>
        {
            var updated = await locationService.UpdateAsync(id, request, ct);
            return Results.Ok(updated);
        })
        .WithName("UpdateLocation")
        .WithSummary("Updates an existing location");

        group.MapDelete("/{id:int}", async (int id, ILocationService locationService, CancellationToken ct) =>
        {
            await locationService.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteLocation")
        .WithSummary("Deletes a location");

        return app;
    }
}