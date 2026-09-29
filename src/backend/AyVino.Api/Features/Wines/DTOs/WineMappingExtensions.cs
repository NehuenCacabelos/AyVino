using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.DTOs;

public static class WineMappingExtensions
{
    public static WineResponseDto ToResponseDto(this Wine wine) => new(
        wine.Id,
        wine.WineryId,
        wine.WineryNameText,
        wine.Name,
        wine.Description,
        wine.WineType.ToString(),
        wine.LocationId,
        wine.SourceType.ToString(),
        wine.DuplicateOfWineId,
        wine.ReviewCount >= 5 ? Math.Round((decimal)wine.RatingSum / wine.ReviewCount, 2) : null,
        wine.ReviewCount);
}