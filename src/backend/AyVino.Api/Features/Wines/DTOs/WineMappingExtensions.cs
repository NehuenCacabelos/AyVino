using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.DTOs;

public static class WineMappingExtensions
{
    public static Wine ToEntity(this CreateWineRequestDto dto, WineType wineType, SourceType sourceType) => new()
    {
        WineryId = dto.WineryId,
        WineryNameText = dto.WineryNameText,
        Name = dto.Name,
        Description = dto.Description,
        WineType = wineType,
        LocationId = dto.LocationId,
        SourceType = sourceType
    };

    public static Wine ToEntity(this UpdateWineRequestDto dto, int id, WineType wineType) => new()
    {
        Id = id,
        WineryId = dto.WineryId,
        WineryNameText = dto.WineryNameText,
        Name = dto.Name,
        Description = dto.Description,
        WineType = wineType,
        LocationId = dto.LocationId
    };

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