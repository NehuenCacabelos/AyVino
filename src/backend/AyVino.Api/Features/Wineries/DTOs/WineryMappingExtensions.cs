using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;

namespace AyVino.Api.Features.Wineries.DTOs;

public static class WineryMappingExtensions
{
    public static Winery ToEntity(this CreateWineryRequestDto dto, int? userId) => new()
    {
        Name = dto.Name,
        Description = dto.Description,
        LocationId = dto.LocationId,
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
        winery.RegisterDate);

    public static IEnumerable<WineryResponseDto> ToResponseDtoList(this IEnumerable<Winery> wineries) =>
        wineries.Select(w => w.ToResponseDto());

    public static CreateWineryRequestDto ToCreateWineryRequestDto(this RegisterWineryRequestDto dto) => new(
        dto.WineryName,
        dto.LocationId,
        dto.Description,
        dto.FoundationYear,
        dto.Website);
}