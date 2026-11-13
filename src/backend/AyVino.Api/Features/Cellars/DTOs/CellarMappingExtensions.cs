using AyVino.Api.Features.Cellars.Models;

namespace AyVino.Api.Features.Cellars.DTOs;

public static class CellarMappingExtensions
{
    public static CellarResponseDto ToResponseDto(this CellarSummaryRow row) =>
        new(row.Id, row.Name, row.VintageCount, row.BottleCount, row.CreatedAt);

    public static IReadOnlyList<CellarResponseDto> ToResponseDtoList(this IEnumerable<CellarSummaryRow> rows) =>
        rows.Select(r => r.ToResponseDto()).ToList();

    public static CellarItemResponseDto ToResponseDto(this CellarItemListRow row) => new(
        row.WineVintageId,
        row.WineId,
        row.Name,
        row.WineType.ToString(),
        row.WineryId,
        row.WineryNameText,
        row.Year,
        row.ImageId,
        row.ReviewCount >= 5 ? Math.Round((decimal)row.RatingSum / row.ReviewCount, 2) :
        row.ReviewCount > 0 ? Math.Round((decimal)row.RatingSum / row.ReviewCount, 1) : null,
        row.ReviewCount,
        row.Quantity,
        row.PurchaseDate,
        row.Notes,
        row.LastChangeAt,
        row.WineryName,
        row.RegionName,
        row.GrapeName);

    public static IReadOnlyList<CellarItemResponseDto> ToResponseDtoList(this IEnumerable<CellarItemListRow> rows) =>
        rows.Select(r => r.ToResponseDto()).ToList();

    public static PublicCellarItemResponseDto ToPublicResponseDto(this CellarItemListRow row) => new(
        row.WineVintageId,
        row.WineId,
        row.Name,
        row.WineType.ToString(),
        row.WineryId,
        row.WineryNameText,
        row.Year,
        row.ImageId,
        row.ReviewCount >= 5 ? Math.Round((decimal)row.RatingSum / row.ReviewCount, 2) : null,
        row.ReviewCount);

    public static IReadOnlyList<PublicCellarItemResponseDto> ToPublicResponseDtoList(this IEnumerable<CellarItemListRow> rows) =>
        rows.Select(r => r.ToPublicResponseDto()).ToList();

    public static CellarItem ToEntity(this AddCellarItemRequestDto request, int cellarId) => new()
    {
        CellarId = cellarId,
        WineVintageId = request.WineVintageId,
        Quantity = request.Quantity,
        PurchaseDate = request.PurchaseDate,
        Notes = request.Notes
    };
}