using System.Security.Claims;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Sensory.DTOs;
using AyVino.Api.Features.Sensory.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Sensory.Endpoints;

public static class SensoryEndpoints
{
    public static IEndpointRouteBuilder MapSensoryEndpoints(this IEndpointRouteBuilder app)
    {
        var vintageGroup = app.MapGroup("/api/wines/{wineId:int}/vintages/{vintageId:int}/sensory").WithTags("Sensory Profile");

        vintageGroup.MapGet("/", async (int wineId, int vintageId, ClaimsPrincipal? user, ISensoryService service, CancellationToken ct) =>
            Results.Ok(await service.GetSensoryByVintageIdAsync(wineId, vintageId, user.GetActorOrNull(), ct)))
            .WithName("GetVintageSensory")
            .WithSummary("Obtiene el perfil sensorial de una cosecha.");

        vintageGroup.MapPut("/", async (int wineId, int vintageId, UpdateVintageSensoryRequestDto request, ClaimsPrincipal user, ISensoryService service, CancellationToken ct) =>
            Results.Ok(await service.UpdateSensoryAsync(wineId, vintageId, request, user.GetActor(), ct)))
            .RequireAuthorization()
            .WithName("UpdateVintageSensory")
            .WithSummary("Actualiza los valores manuales del perfil sensorial de una cosecha.");

        var previewGroup = app.MapGroup("/api/sensory").WithTags("Sensory Profile");

        previewGroup.MapPost("/preview", async (SensoryPreviewRequestDto request, ClaimsPrincipal user, ISensoryService service, CancellationToken ct) =>
            Results.Ok(await service.PreviewSensoryAsync(request, ct)))
            .RequireAuthorization()
            .WithName("PreviewSensory")
            .WithSummary("Previsualiza el perfil sensorial calculado a partir de un corte de uvas.");

        return app;
    }
}
