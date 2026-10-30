using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Wineries.Endpoints;

public static class WineryEndpoints
{
    public static IEndpointRouteBuilder MapWineryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wineries").WithTags("Wineries");

        group.MapGet("/", async (int pageNumber, int pageSize, string? status, int? locationId, ClaimsPrincipal? user, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(pageNumber, pageSize, status, locationId, user.GetActorOrNull(), ct)))
            .WithName("GetAllWineries")
            .WithSummary("Lists wineries, paginated, with optional status and location filters.");

        group.MapGet("/me", async (ClaimsPrincipal user, IWineryService service, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            return Results.Ok(await service.GetByUserIdAsync(actor.UserId, ct));
        })
            .RequireAuthorization()
            .WithName("GetMyWinery")
            .WithSummary("Gets the winery associated with the authenticated user.");

        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal? user, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.GetByIdAsync(id, user.GetActorOrNull(), ct)))
            .WithName("GetWineryById")
            .WithSummary("Gets a winery by ID.");

        group.MapPost("/", async (CreateWineryRequestDto request, IWineryService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/wineries/{created.Id}", created);
        })
            .RequireAuthorization()
            .WithName("CreateWinery")
            .WithSummary("Creates a winery with no owner assigned (starts as Pending, UserId null).");

        group.MapPost("/register", async (RegisterWineryRequestDto request, IWineryService service, CancellationToken ct) =>
        {
            var created = await service.RegisterWineryAsync(request, ct);
            return Results.Created($"/api/wineries/{created.Winery.Id}", created);
        })
            .AllowAnonymous()
            .WithName("RegisterWinery")
            .WithSummary("Creates a User (Role=Winery) and its associated Winery in a single flow, returns a JWT.");

        group.MapPut("/{id:int}", async (int id, UpdateWineryRequestDto request, ClaimsPrincipal user, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateAsync(id, request, user.GetActor(), ct)))
            .RequireAuthorization()
            .WithName("UpdateWinery")
            .WithSummary("Updates an existing winery's data.");

        group.MapPatch("/{id:int}/status", async (int id, ChangeWineryStatusRequestDto request, IWineryService service, CancellationToken ct) =>
            Results.Ok(await service.ChangeStatusAsync(id, request, ct)))
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("ChangeWineryStatus")
            .WithSummary("Changes a winery's moderation status (Pending/Approved/Rejected).")
            .WithAudit(AuditAction.WineryStatusChanged, "Winery", idRouteKey: "id", details: (ctx, res) => ctx.Arguments.OfType<ChangeWineryStatusRequestDto>().FirstOrDefault()?.Status);

        group.MapDelete("/{id:int}", async (int id, IWineryService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
            .RequireAuthorization(AppPolicies.RequireAdmin)
            .WithName("DeleteWinery")
            .WithSummary("Deletes a winery.")
            .WithAudit(AuditAction.WineryDeleted, "Winery", idRouteKey: "id");

        group.MapPut("/{id:int}/logo", async (int id, IFormFile file, ClaimsPrincipal user, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            var imageId = await imageOrchestrator.UploadWineryLogoAsync(id, file, actor, ct);
            return Results.Ok(new { imageId });
        })
            .RequireAuthorization()
            .DisableAntiforgery()
            .WithName("UploadWineryLogo")
            .WithSummary("Sube o reemplaza el logo de una bodega.");

        group.MapDelete("/{id:int}/logo", async (int id, ClaimsPrincipal user, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            await imageOrchestrator.DeleteWineryLogoAsync(id, actor, ct);
            return Results.NoContent();
        })
            .RequireAuthorization()
            .WithName("DeleteWineryLogo")
            .WithSummary("Elimina el logo de una bodega.");

        group.MapPut("/{id:int}/banner", async (int id, IFormFile file, ClaimsPrincipal user, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            var imageId = await imageOrchestrator.UploadWineryBannerAsync(id, file, actor, ct);
            return Results.Ok(new { imageId });
        })
            .RequireAuthorization()
            .DisableAntiforgery()
            .WithName("UploadWineryBanner")
            .WithSummary("Sube o reemplaza el banner de una bodega.");

        group.MapDelete("/{id:int}/banner", async (int id, ClaimsPrincipal user, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            await imageOrchestrator.DeleteWineryBannerAsync(id, actor, ct);
            return Results.NoContent();
        })
            .RequireAuthorization()
            .WithName("DeleteWineryBanner")
            .WithSummary("Elimina el banner de una bodega.");

        return app;
    }
}
