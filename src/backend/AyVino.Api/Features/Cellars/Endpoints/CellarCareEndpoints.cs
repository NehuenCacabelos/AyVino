using System.Security.Claims;
using AyVino.Api.Features.Cellars.Services;

namespace AyVino.Api.Features.Cellars.Endpoints;

public static class CellarCareEndpoints
{
    public static IEndpointRouteBuilder MapCellarCareEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/cellars/{cellarId:int}/care-summary",
            async (int cellarId, ClaimsPrincipal user, ICellarCareService service, CancellationToken ct) =>
                Results.Ok(await service.GetSummaryAsync(user.GetUserId(), cellarId, ct)))
            .RequireAuthorization()
            .WithTags("Cellars")
            .WithName("GetCellarCareSummary")
            .WithSummary("Temperatura, decantado y ventana de consumo de cada cosecha de la cava (para saber qué está listo)");

        return app;
    }
}