using System.Security.Claims;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Services;

namespace AyVino.Api.Features.Cellars.Endpoints;

public static class CellarItemEndpoints
{
    public static IEndpointRouteBuilder MapCellarItemEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cellars/{cellarId:int}/items").WithTags("Cellars").RequireAuthorization();

        group.MapPost("/", async (int cellarId, AddCellarItemRequestDto request, ClaimsPrincipal user, ICellarItemService service, CancellationToken ct) =>
        {
            var created = await service.AddAsync(user.GetUserId(), cellarId, request, ct);
            return Results.Created($"/api/cellars/{cellarId}/items/{created.WineVintageId}", created);
        }).WithName("AddCellarItem").WithSummary("Agrega una cosecha a la cava (409 si ya está)");

        group.MapGet("/", async (int cellarId, ClaimsPrincipal user, ICellarItemService service, CancellationToken ct, string? wineType, int? year, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetAllAsync(user.GetUserId(), cellarId, pageNumber, pageSize, wineType, year, ct)))
            .WithName("GetCellarItems").WithSummary("Contenido de la cava (paginado). Filtros opcionales: wineType, year");

        group.MapGet("/{wineVintageId:int}", async (int cellarId, int wineVintageId, ClaimsPrincipal user, ICellarItemService service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(user.GetUserId(), cellarId, wineVintageId, ct)))
            .WithName("GetCellarItem").WithSummary("Detalle de una cosecha dentro de la cava");

        group.MapPut("/{wineVintageId:int}", async (int cellarId, int wineVintageId, UpdateCellarItemRequestDto request, ClaimsPrincipal user, ICellarItemService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(user.GetUserId(), cellarId, wineVintageId, request, ct)))
            .WithName("UpdateCellarItem").WithSummary("Reemplaza cantidad, fecha de compra y notas");

        group.MapDelete("/{wineVintageId:int}", async (int cellarId, int wineVintageId, ClaimsPrincipal user, ICellarItemService service, CancellationToken ct) =>
        {
            await service.RemoveAsync(user.GetUserId(), cellarId, wineVintageId, ct);
            return Results.NoContent();
        }).WithName("RemoveCellarItem").WithSummary("Saca la cosecha de la cava");

        return app;
    }
}