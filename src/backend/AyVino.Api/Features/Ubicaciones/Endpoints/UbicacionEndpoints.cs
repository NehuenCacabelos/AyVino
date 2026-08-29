using AyVino.Api.Features.Ubicaciones.DTOs;
using AyVino.Api.Features.Ubicaciones.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Ubicaciones.Endpoints;

public static class UbicacionEndpoints
{
    public static IEndpointRouteBuilder MapUbicacionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ubicaciones")
                       .WithTags("Ubicaciones");

        group.MapPost("/", async (CreateUbicacionRequestDto request, IUbicacionService ubicacionService, CancellationToken ct) =>
        {
            var created = await ubicacionService.CreateAsync(request, ct);
            return Results.Created($"/api/ubicaciones/{created.Id}", created);
        })
        .WithName("CreateUbicacion")
        .WithSummary("Crea una nueva ubicación");

        group.MapGet("/", async (int pageNumber, int pageSize, string? pais, IUbicacionService ubicacionService, CancellationToken ct) =>
        {
            var ubicaciones = await ubicacionService.GetAllAsync(pageNumber, pageSize, pais, ct);
            return Results.Ok(ubicaciones);
        })
        .WithName("GetAllUbicaciones")
        .WithSummary("Obtiene la lista paginada de ubicaciones, con filtro opcional por país");

        group.MapGet("/{id:int}", async (int id, IUbicacionService ubicacionService, CancellationToken ct) =>
        {
            var ubicacion = await ubicacionService.GetByIdAsync(id, ct);
            return Results.Ok(ubicacion);
        })
        .WithName("GetUbicacionById")
        .WithSummary("Obtiene una ubicación por su ID");

        group.MapPut("/{id:int}", async (int id, UpdateUbicacionRequestDto request, IUbicacionService ubicacionService, CancellationToken ct) =>
        {
            var updated = await ubicacionService.UpdateAsync(id, request, ct);
            return Results.Ok(updated);
        })
        .WithName("UpdateUbicacion")
        .WithSummary("Actualiza una ubicación existente");

        group.MapDelete("/{id:int}", async (int id, IUbicacionService ubicacionService, CancellationToken ct) =>
        {
            await ubicacionService.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteUbicacion")
        .WithSummary("Elimina una ubicación");

        return app;
    }
}