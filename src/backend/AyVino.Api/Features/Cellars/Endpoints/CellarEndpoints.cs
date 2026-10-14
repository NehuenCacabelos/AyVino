using System.Security.Claims;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Services;

namespace AyVino.Api.Features.Cellars.Endpoints;

public static class CellarEndpoints
{
    public static IEndpointRouteBuilder MapCellarEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cellars").WithTags("Cellars").RequireAuthorization();

        group.MapPost("/", async (CreateCellarRequestDto request, ClaimsPrincipal user, ICellarService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(user.GetUserId(), request, ct);
            return Results.Created($"/api/cellars/{created.Id}", created);
        }).WithName("CreateCellar").WithSummary("Crea una cava propia (ej. Casa, Depto)");

        group.MapGet("/me", async (ClaimsPrincipal user, ICellarService service, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetAllByUserAsync(user.GetUserId(), pageNumber, pageSize, ct)))
            .WithName("GetMyCellars").WithSummary("Mis cavas (paginado) con cantidad de cosechas y botellas");

        group.MapGet("/{cellarId:int}", async (int cellarId, ClaimsPrincipal user, ICellarService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(user.GetUserId(), cellarId, ct)))
            .WithName("GetCellarById").WithSummary("Detalle de una cava propia");

        group.MapPut("/{cellarId:int}", async (int cellarId, UpdateCellarRequestDto request, ClaimsPrincipal user, ICellarService service, CancellationToken ct) =>
            Results.Ok(await service.RenameAsync(user.GetUserId(), cellarId, request, ct)))
            .WithName("RenameCellar").WithSummary("Renombra una cava propia");

        group.MapDelete("/{cellarId:int}", async (int cellarId, ClaimsPrincipal user, ICellarService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(user.GetUserId(), cellarId, ct);
            return Results.NoContent();
        }).WithName("DeleteCellar").WithSummary("Borra una cava vacía (409 si todavía tiene botellas)");

        return app;
    }
}