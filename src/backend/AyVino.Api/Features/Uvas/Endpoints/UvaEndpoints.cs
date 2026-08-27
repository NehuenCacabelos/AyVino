using AyVino.Api.Features.Uvas.DTOs;
using AyVino.Api.Features.Uvas.Services;

namespace AyVino.Api.Features.Uvas.Endpoints;

public static class UvaEndpoints
{
    public static IEndpointRouteBuilder MapUvaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uvas").WithTags("Uvas");

        group.MapPost("/", async (CreateUvaRequestDto request, IUvaService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/uvas/{created.Id}", created);
        }).WithName("CreateUva").WithSummary("Crea una nueva uva.");

        group.MapGet("/", async (int pageNumber, int pageSize, string? tipoColor, IUvaService service, CancellationToken ct) =>
{
        var uvas = await service.GetAllAsync(pageNumber, pageSize, tipoColor, ct);
            return Results.Ok(uvas);
        }).WithName("GetUvas").WithSummary("Lista uvas paginadas, con filtro opcional por tipo de color.");

        group.MapGet("/{id:int}", async (int id, IUvaService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct))
        ).WithName("GetUvaById").WithSummary("Obtiene una uva por Id.");

        group.MapPut("/{id:int}", async (int id, UpdateUvaRequestDto request, IUvaService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct))
        ).WithName("UpdateUva").WithSummary("Actualiza una uva existente.");

        group.MapDelete("/{id:int}", async (int id, IUvaService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        }).WithName("DeleteUva").WithSummary("Elimina una uva.");

        return app;
    }
}