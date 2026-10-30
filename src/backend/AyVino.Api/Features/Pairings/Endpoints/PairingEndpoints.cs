using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Pairings.DTOs;
using AyVino.Api.Features.Pairings.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace AyVino.Api.Features.Pairings.Endpoints;

public static class PairingEndpoints
{
    public static IEndpointRouteBuilder MapPairingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pairings").WithTags("Pairings");

        group.MapPost("/", async (CreatePairingRequestDto request, IPairingService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/pairings/{created.Id}", created);
        })
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("CreatePairing")
        .WithSummary("Creates a new pairing catalog entry.")
        .WithAudit(AuditAction.PairingCreated, "Pairing", entityIdResolver: (ctx, res) => (res as Created<PairingResponseDto>)?.Value?.Id, details: (ctx, res) => ctx.Arguments.OfType<CreatePairingRequestDto>().FirstOrDefault()?.Name);

        group.MapGet("/", async (int pageNumber, int pageSize, string? category, IPairingService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, category, ct))
        ).WithName("GetPairings").WithSummary("Lists paginated pairings, with optional filter by category.");

        group.MapGet("/{id:int}", async (int id, IPairingService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, ct))
        ).WithName("GetPairingById").WithSummary("Gets a pairing by Id.");

        group.MapPut("/{id:int}", async (int id, UpdatePairingRequestDto request, IPairingService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, ct))
        )
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("UpdatePairing")
        .WithSummary("Updates an existing pairing.")
        .WithAudit(AuditAction.PairingUpdated, "Pairing", idRouteKey: "id", details: (ctx, res) => ctx.Arguments.OfType<UpdatePairingRequestDto>().FirstOrDefault()?.Name);

        group.MapDelete("/{id:int}", async (int id, IPairingService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("DeletePairing")
        .WithSummary("Deletes a pairing.")
        .WithAudit(AuditAction.PairingDeleted, "Pairing", idRouteKey: "id");

        // Sub-recurso: asociación entre un vino y sus maridajes.
        var wineGroup = app.MapGroup("/api/wines/{wineId:int}/pairings").WithTags("Pairings");

        wineGroup.MapGet("/", async (int wineId, IPairingService service, CancellationToken ct) =>
            Results.Ok(await service.GetByWineIdAsync(wineId, ct))
        ).WithName("GetWinePairings").WithSummary("Lists the pairings associated with a wine.");

        wineGroup.MapPost("/{pairingId:int}", async (int wineId, int pairingId, ClaimsPrincipal user, IPairingService service, CancellationToken ct) =>
        {
            await service.AddToWineAsync(wineId, pairingId, user.GetActor(), ct);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("AddWinePairing")
        .WithSummary("Associates a pairing with a wine.");

        wineGroup.MapDelete("/{pairingId:int}", async (int wineId, int pairingId, ClaimsPrincipal user, IPairingService service, CancellationToken ct) =>
        {
            await service.RemoveFromWineAsync(wineId, pairingId, user.GetActor(), ct);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("RemoveWinePairing")
        .WithSummary("Removes a pairing from a wine.");

        return app;
    }
}
