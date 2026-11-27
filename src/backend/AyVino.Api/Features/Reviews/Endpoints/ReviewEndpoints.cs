using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Extensions;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Services;

namespace AyVino.Api.Features.Reviews.Endpoints;

public static class ReviewEndpoints
{
    public static IEndpointRouteBuilder MapReviewEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reviews").WithTags("Reviews");

        group.MapGet("/", async (
            HttpResponse response,
            IReviewService service,
            CancellationToken ct,
            int pageNumber = 1,
            int pageSize = 10,
            int? wineId = null,
            int? wineVintageId = null,
            int? userId = null,
            decimal? rating = null) =>
        {
            var result = await service.GetPagedForAdminWithCountAsync(pageNumber, pageSize, wineId, wineVintageId, userId, rating, ct);
            return response.OkWithTotalCount(result.Items, result.TotalCount);
        })
        .RequireAuthorization(AppPolicies.RequireAdmin)
        .WithName("GetReviewsForAdmin")
        .WithSummary("Lista reseñas globalmente para moderación por administradores.");

        group.MapPost("/", async (CreateReviewRequestDto request, ClaimsPrincipal user, IReviewService service, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var created = await service.CreateAsync(request, userId, ct);
            return Results.Created($"/api/reviews/{created.Id}", created);
        }).RequireAuthorization()
          .WithName("CreateReview")
          .WithSummary("Crea una reseña para una cosecha puntual.");

        group.MapPut("/{id:int}", async (int id, UpdateReviewRequestDto request, ClaimsPrincipal user, IReviewService service, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var updated = await service.UpdateAsync(id, request, userId, ct);
            return Results.Ok(updated);
        }).RequireAuthorization()
          .WithName("UpdateReview")
          .WithSummary("Edita una reseña propia.");

        group.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, IReviewService service, CancellationToken ct) =>
        {
            var actor = user.GetActor();
            await service.DeleteAsync(id, actor, ct);
            return Results.NoContent();
        }).RequireAuthorization()
          .WithName("DeleteReview")
          .WithSummary("Borra una reseña propia (usuario) o modera cualquier reseña (administrador).");

        var vintageGroup = app.MapGroup("/api/wine-vintages/{vintageId:int}/reviews")
           .WithTags("Reviews");

        vintageGroup.MapGet("/", async (int vintageId, int pageNumber, int pageSize, IReviewService service, CancellationToken ct) =>
                Results.Ok(await service.GetAllByVintageAsync(vintageId, pageNumber, pageSize, ct)))
           .WithName("GetReviewsByVintage")
           .WithSummary("Lista paginada de reseñas de una cosecha puntual.");

        vintageGroup.MapGet("/me", async (int vintageId, ClaimsPrincipal user, IReviewService service, CancellationToken ct) =>
        {
            var userId = user.GetUserId();
            var review = await service.GetByVintageAndUserAsync(vintageId, userId, ct);
            return review is not null ? Results.Ok(review) : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("GetMyReviewByVintage")
        .WithSummary("Obtiene la reseña del usuario autenticado para una cosecha puntual (404 si no tiene).");

        app.MapGroup("/api/wines/{wineId:int}/reviews")
           .WithTags("Reviews")
           .MapGet("/", async (int wineId, int pageNumber, int pageSize, IReviewService service, CancellationToken ct) =>
                Results.Ok(await service.GetAllByWineAsync(wineId, pageNumber, pageSize, ct)))
           .WithName("GetReviewsByWine")
           .WithSummary("Feed paginado de todas las reseñas de una etiqueta, de todas sus cosechas.");

        return app;
    }
}
