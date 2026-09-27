using AyVino.Api.Features.States.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.States.Endpoints;

public static class StateEndpoints
{
    public static IEndpointRouteBuilder MapStateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/states").WithTags("States");

        group.MapGet("/", async (IStateService stateService, CancellationToken ct) =>
            Results.Ok(await stateService.GetAllAsync(ct)))
            .WithName("GetAllStates")
            .WithSummary("Gets all Argentine provinces");

        group.MapGet("/{id:int}", async (int id, IStateService stateService, CancellationToken ct) =>
            Results.Ok(await stateService.GetByIdAsync(id, ct)))
            .WithName("GetStateById")
            .WithSummary("Gets a province by its ID");

        return app;
    }
}