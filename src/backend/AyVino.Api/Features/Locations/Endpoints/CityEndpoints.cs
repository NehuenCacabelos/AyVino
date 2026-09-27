using AyVino.Api.Features.Cities.DTOs;
using AyVino.Api.Features.Cities.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Cities.Endpoints;

public static class CityEndpoints
{
    public static IEndpointRouteBuilder MapCityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cities").WithTags("Cities");

        group.MapPost("/", async (CreateCityRequestDto request, ICityService cityService, CancellationToken ct) =>
        {
            var city = await cityService.GetOrCreateAsync(request, ct);
            return Results.Created($"/api/cities/{city.Id}", city);
        })
        .WithName("GetOrCreateCity")
        .WithSummary("Returns an existing city or creates it as Pending if it doesn't exist");

        group.MapGet("/", async (int pageNumber, int pageSize, int? stateId, string? status, ICityService cityService, CancellationToken ct) =>
            Results.Ok(await cityService.GetAllAsync(pageNumber, pageSize, stateId, status, ct)))
            .WithName("GetAllCities")
            .WithSummary("Gets a paginated list of cities, filterable by state and status");

        group.MapGet("/{id:int}", async (int id, ICityService cityService, CancellationToken ct) =>
            Results.Ok(await cityService.GetByIdAsync(id, ct)))
            .WithName("GetCityById")
            .WithSummary("Gets a city by its ID");

        group.MapPatch("/{id:int}/status", async (int id, UpdateCityStatusRequestDto request, ICityService cityService, CancellationToken ct) =>
            Results.Ok(await cityService.UpdateStatusAsync(id, request, ct)))
            .WithName("UpdateCityStatus")
            .WithSummary("Admin: approves or rejects a pending city");

        return app;
    }
}