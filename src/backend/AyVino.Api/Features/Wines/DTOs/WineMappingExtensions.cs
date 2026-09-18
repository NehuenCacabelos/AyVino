using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.DTOs;

public static class WineMappingExtensions
{
    public static WineResponseDto ToResponseDto(this Wine wine, IEnumerable<WineGrape> grapes) => new(
        wine.Id,
        wine.WineryId,
        wine.Name,
        wine.Description,
        wine.WineType.ToString(),
        wine.LocationId,
        wine.Year,
        wine.AlcoholContent,
        wine.ServingTemperature,
        wine.AgingAdvice,
        wine.LabelImageUrl,
        wine.ApprovalStatus.ToString(),
        wine.UploadedByUserId,
        wine.RegisterDate,
        grapes.Select(g => new WineGrapeResponseDto(g.GrapeId, g.Percentage)));
}