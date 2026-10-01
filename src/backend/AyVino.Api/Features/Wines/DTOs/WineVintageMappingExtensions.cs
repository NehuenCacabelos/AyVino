using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.DTOs;

public static class WineVintageMappingExtensions
{
    public static WineVintage ToEntity(this CreateWineVintageRequestDto dto, int wineId = 0) => new()
    {
        WineId = wineId,
        Year = dto.Year,
        AlcoholContent = dto.AlcoholContent,
        ServingTemperature = dto.ServingTemperature,
        AgingAdvice = dto.AgingAdvice,
        ImageUrl = dto.ImageUrl,
        ApprovalStatus = ApprovalStatus.Pending,
        UploadedByUserId = dto.UploadedByUserId,
        RegisterDate = DateTime.UtcNow
    };

    public static WineVintage ToEntity(this UpdateWineVintageRequestDto dto, int id, int wineId) => new()
    {
        Id = id,
        WineId = wineId,
        Year = dto.Year,
        AlcoholContent = dto.AlcoholContent,
        ServingTemperature = dto.ServingTemperature,
        AgingAdvice = dto.AgingAdvice,
        ImageUrl = dto.ImageUrl
    };

    public static WineVintageResponseDto ToResponseDto(this WineVintage vintage, IEnumerable<WineGrape> grapes) => new(
        vintage.Id,
        vintage.WineId,
        vintage.Year,
        vintage.AlcoholContent,
        vintage.ServingTemperature,
        vintage.AgingAdvice,
        vintage.ImageUrl,
        vintage.ApprovalStatus.ToString(),
        vintage.UploadedByUserId,
        vintage.RegisterDate,
        vintage.ReviewCount >= 5 ? Math.Round((decimal)vintage.RatingSum / vintage.ReviewCount, 2) : null,
        vintage.ReviewCount,
        grapes.Select(g => new WineGrapeResponseDto(g.GrapeId, g.Percentage)));
}