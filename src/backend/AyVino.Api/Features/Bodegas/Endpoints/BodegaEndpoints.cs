using AyVino.Api.Features.Bodegas.DTOs;
using AyVino.Api.Features.Bodegas.Services;

namespace AyVino.Api.Features.Bodegas.Endpoints;

public static class BodegaEndpoints
{
    public static IEndpointRouteBuilder MapBodegaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bodegas").WithTags("Bodegas");

        group.MapGet("/", async (int pageNumber, int pageSize, string? estado, int? ubicacionId, IBodegaService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, estado, ubicacionId, ct)))
            .WithName("GetAllBodegas")
            .WithSummary("Lista bodegas paginadas, con filtro opcional por estado y ubicación.");

        group.MapGet("/{id:int}", async (int id, IBodegaService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct)))
            .WithName("GetBodegaById")
            .WithSummary("Obtiene una bodega por ID.");

        group.MapPost("/", async (CreateBodegaRequestDto request, IBodegaService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/bodegas/{created.Id}", created);
        })
            .WithName("CreateBodega")
            .WithSummary("Crea una bodega sin dueño asignado (nace en Pendiente, UsuarioId null).");

        group.MapPost("/registro", async (RegistrarBodegaRequestDto request, IBodegaService service, CancellationToken ct) =>
        {
            var created = await service.RegistrarBodegaAsync(request, ct);
            return Results.Created($"/api/bodegas/{created.Bodega.Id}", created);
        })
            .WithName("RegistrarBodega")
            .WithSummary("Crea un Usuario (Rol=Bodega) y su Bodega asociada en un solo flujo.");

        group.MapPut("/{id:int}", async (int id, UpdateBodegaRequestDto request, IBodegaService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct)))
            .WithName("UpdateBodega")
            .WithSummary("Actualiza los datos de una bodega existente.");

        group.MapPut("/{id:int}/estado", async (int id, string estado, IBodegaService service, CancellationToken ct) =>
            Results.Ok(await service.CambiarEstadoAsync(id, estado, ct)))
            .WithName("CambiarEstadoBodega")
            .WithSummary("Cambia el estado de moderación de una bodega (Pendiente/Aprobada/Rechazada).");

        group.MapDelete("/{id:int}", async (int id, IBodegaService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .WithName("DeleteBodega")
            .WithSummary("Elimina una bodega.");

        return app;
    }
}