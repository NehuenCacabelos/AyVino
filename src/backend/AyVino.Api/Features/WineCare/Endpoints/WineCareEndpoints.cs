using AyVino.Api.Features.WineCare.Services;

namespace AyVino.Api.Features.WineCare.Endpoints;

public static class WineCareEndpoints
{
    public static IEndpointRouteBuilder MapWineCareEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/wines/{wineId:int}/vintages/{vintageId:int}/care-recommendations",
            async (int wineId, int vintageId, IWineCareService service, CancellationToken ct) =>
                Results.Ok(await service.GetForVintageAsync(wineId, vintageId, ct)))
            .WithTags("Wine Care")
            .WithName("GetWineCareRecommendations")
            .WithSummary("Temperatura de servicio, decantado y ventana de consumo de una cosecha (reglas generales, orientativas)");

        return app;
    }
}