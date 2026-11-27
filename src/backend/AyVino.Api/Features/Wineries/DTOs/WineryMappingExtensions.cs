using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;

namespace AyVino.Api.Features.Wineries.DTOs;

public static class WineryMappingExtensions
{
    public static Winery ToEntity(this CreateWineryRequestDto dto, int locationId, decimal? latitude, decimal? longitude, int? userId) => new()
    {
        Name = dto.Name,
        Description = dto.Description,
        LocationId = locationId,
        Latitude = latitude,
        Longitude = longitude,
        FoundationYear = dto.FoundationYear,
        Website = dto.Website,
        UserId = userId,
        Status = WineryStatus.Pending,
        RegisterDate = DateTime.UtcNow
    };

    public static WineryResponseDto ToResponseDto(this Winery winery) => new(
        winery.Id,
        winery.Name,
        winery.Description,
        winery.LocationId,
        winery.FoundationYear,
        winery.Website,
        winery.UserId,
        winery.Status.ToString(),
        winery.RegisterDate,
        winery.Latitude,
        winery.Longitude,
        winery.LogoImageId,
        winery.BannerImageId,
        winery.StateName != null && winery.RegionName != null
            ? new WineryLocationSummaryDto(winery.StateName, winery.RegionName)
            : null);

    public static IEnumerable<WineryResponseDto> ToResponseDtoList(this IEnumerable<Winery> wineries) =>
        wineries.Select(w => w.ToResponseDto());
}
