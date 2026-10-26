using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.DTOs;

public static class AdminWineVintageMappingExtensions
{
    public static AdminWineVintageListItemDto ToListItemDto(this AdminWineVintageListRow row) => new(
        row.VintageId,
        row.WineId,
        row.WineName,
        row.WineType.ToString(),
        row.WineryId,
        row.WineryName,
        row.Year,
        row.AlcoholContent,
        row.ImageUrl,
        row.ApprovalStatus.ToString(),
        row.UploadedByUserId,
        row.UploadedByUsername,
        row.RegisterDate
    );

    public static IEnumerable<AdminWineVintageListItemDto> ToListItemDtoList(this IEnumerable<AdminWineVintageListRow> rows) =>
        rows.Select(r => r.ToListItemDto());
}
