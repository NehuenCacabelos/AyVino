using System.Security.Claims;
using AyVino.Api.Features.Follows.Services;

namespace AyVino.Api.Features.Follows.Endpoints;

public static class FollowEndpoints
{
    public static IEndpointRouteBuilder MapFollowEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Follows").RequireAuthorization();

        // ---------- Usuarios ----------
        group.MapPost("/users/{id:int}/follow", async (int id, ClaimsPrincipal user, IFollowService service, CancellationToken ct) =>
        {
            await service.FollowUserAsync(user.GetUserId(), id, ct);
            return Results.NoContent();
        }).WithName("FollowUser").WithSummary("Seguir a un usuario");

        group.MapDelete("/users/{id:int}/follow", async (int id, ClaimsPrincipal user, IFollowService service, CancellationToken ct) =>
        {
            await service.UnfollowUserAsync(user.GetUserId(), id, ct);
            return Results.NoContent();
        }).WithName("UnfollowUser").WithSummary("Dejar de seguir a un usuario");

        group.MapGet("/users/{id:int}/followers", async (int id, IFollowService service, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetUserFollowersAsync(id, pageNumber, pageSize, ct)))
            .WithName("GetUserFollowers").WithSummary("Seguidores de un usuario (paginado)");

        group.MapGet("/users/me/following", async (ClaimsPrincipal user, IFollowService service, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetMyFollowingUsersAsync(user.GetUserId(), pageNumber, pageSize, ct)))
            .WithName("GetMyFollowingUsers").WithSummary("Usuarios que sigo (paginado)");

        // ---------- Bodegas ----------
        group.MapPost("/wineries/{id:int}/follow", async (int id, ClaimsPrincipal user, IFollowService service, CancellationToken ct) =>
        {
            await service.FollowWineryAsync(user.GetUserId(), id, ct);
            return Results.NoContent();
        }).WithName("FollowWinery").WithSummary("Seguir a una bodega aprobada");

        group.MapDelete("/wineries/{id:int}/follow", async (int id, ClaimsPrincipal user, IFollowService service, CancellationToken ct) =>
        {
            await service.UnfollowWineryAsync(user.GetUserId(), id, ct);
            return Results.NoContent();
        }).WithName("UnfollowWinery").WithSummary("Dejar de seguir a una bodega");

        group.MapGet("/wineries/{id:int}/followers", async (int id, IFollowService service, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetWineryFollowersAsync(id, pageNumber, pageSize, ct)))
            .WithName("GetWineryFollowers").WithSummary("Seguidores de una bodega (paginado)");

        group.MapGet("/users/me/following-wineries", async (ClaimsPrincipal user, IFollowService service, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetMyFollowingWineriesAsync(user.GetUserId(), pageNumber, pageSize, ct)))
            .WithName("GetMyFollowingWineries").WithSummary("Bodegas que sigo (paginado)");

        return app;
    }
}