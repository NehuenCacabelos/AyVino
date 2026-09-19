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
        var group = app.MapGroup("/api/locations").WithTags("Locations");

        group.MapPost("/", async (CreateLocationRequestDto request, ILocationService locationService, CancellationToken ct) =>
        {
            var created = await locationService.CreateAsync(request, ct);
            return Results.Created($"/api/locations/{created.Id}", created);
        })
        .WithName("CreateLocation")
        .WithSummary("Creates a new location from an existing CityId");

        group.MapGet("/{id:int}", async (int id, ILocationService locationService, CancellationToken ct) =>
            Results.Ok(await locationService.GetByIdAsync(id, ct)))
            .WithName("GetLocationById")
            .WithSummary("Gets a location with its city/state names");

        return app;
    }
}