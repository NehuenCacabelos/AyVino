using System.Security.Claims;
using AyVino.Api.Features.UserWines.Services;

namespace AyVino.Api.Features.UserWines.Endpoints;

public static class UserWineEndpoints
{
    public static IEndpointRouteBuilder MapUserWineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("UserWines").RequireAuthorization();

        // ---------- Marcas sobre un vino puntual ----------
        group.MapPut("/wines/{wineId:int}/wanted", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
        {
            await service.MarkWantedAsync(user.GetUserId(), wineId, ct);
            return Results.NoContent();
        }).WithName("MarkWineAsWanted").WithSummary("Agrega el vino a tu lista de deseados");

        group.MapDelete("/wines/{wineId:int}/wanted", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
        {
            await service.UnmarkWantedAsync(user.GetUserId(), wineId, ct);
            return Results.NoContent();
        }).WithName("UnmarkWineAsWanted").WithSummary("Saca el vino de tu lista de deseados");

        // Sin DELETE a propósito: "probado" no se desmarca.
        group.MapPut("/wines/{wineId:int}/tried", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
        {
            await service.MarkTriedAsync(user.GetUserId(), wineId, ct);
            return Results.NoContent();
        }).WithName("MarkWineAsTried").WithSummary("Marca el vino como probado (no se puede desmarcar)");

        group.MapPut("/wines/{wineId:int}/favorite", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
        {
            await service.MarkFavoriteAsync(user.GetUserId(), wineId, ct);
            return Results.NoContent();
        }).WithName("MarkWineAsFavorite").WithSummary("Agrega el vino a tus favoritos");

        group.MapDelete("/wines/{wineId:int}/favorite", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
        {
            await service.UnmarkFavoriteAsync(user.GetUserId(), wineId, ct);
            return Results.NoContent();
        }).WithName("UnmarkWineAsFavorite").WithSummary("Saca el vino de tus favoritos");

        group.MapGet("/wines/{wineId:int}/my-marks", async (int wineId, ClaimsPrincipal user, IUserWineService service, CancellationToken ct) =>
            Results.Ok(await service.GetMarksAsync(user.GetUserId(), wineId, ct)))
            .WithName("GetMyWineMarks").WithSummary("Cómo tenés marcado este vino (deseado, probado, favorito)");

        // ---------- Mis listas: una sola ruta paginada con filtros ----------
        group.MapGet("/user-wines/me", async (ClaimsPrincipal user, IUserWineService service, CancellationToken ct, bool? wanted, bool? tried, bool? favorite, int pageNumber = 1, int pageSize = 10) =>
            Results.Ok(await service.GetAllByUserAsync(user.GetUserId(), pageNumber, pageSize, wanted, tried, favorite, ct)))
            .WithName("GetMyUserWines").WithSummary("Mis vinos marcados (paginado). Filtros opcionales: wanted, tried, favorite");

        return app;
    }
}