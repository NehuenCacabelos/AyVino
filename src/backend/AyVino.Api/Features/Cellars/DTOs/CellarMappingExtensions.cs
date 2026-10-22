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
        row.ImageUrl,
        // Misma regla que Reviews/UserWines: el promedio recién se muestra desde 5 reseñas.
        row.ReviewCount >= 5 ? Math.Round((decimal)row.RatingSum / row.ReviewCount, 2) : null,
        row.ReviewCount,
        row.Quantity,
        row.PurchaseDate,
        row.Notes,
        row.LastChangeAt);

    public static IReadOnlyList<CellarItemResponseDto> ToResponseDtoList(this IEnumerable<CellarItemListRow> rows) =>
        rows.Select(r => r.ToResponseDto()).ToList();

    public static CellarItem ToEntity(this AddCellarItemRequestDto request, int cellarId) => new()
    {
        CellarId = cellarId,
        WineVintageId = request.WineVintageId,
        Quantity = request.Quantity,
        PurchaseDate = request.PurchaseDate,
        Notes = request.Notes
    };
}