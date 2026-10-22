using AyVino.Api.Features.UserWines.Models;

namespace AyVino.Api.Features.UserWines.DTOs;

public static class UserWineMappingExtensions
{
    public static UserWineMarksResponseDto ToMarksDto(this UserWine userWine) =>
        new(userWine.WineId, userWine.IsWanted, userWine.IsTried, userWine.IsFavorite);

    public static UserWineListItemDto ToListItemDto(this UserWineListRow row) => new(
        row.WineId,
        row.Name,
        row.WineType.ToString(),
        row.WineryId,
        row.WineryNameText,
        // Misma regla que WineResponseDto: el promedio recién se muestra desde 5 reseñas.
        row.ReviewCount >= 5 ? Math.Round((decimal)row.RatingSum / row.ReviewCount, 2) : null,
        row.ReviewCount,
        row.IsWanted,
        row.IsTried,
        row.IsFavorite,
        row.LastChangeAt);

    public static IReadOnlyList<UserWineListItemDto> ToListItemDtoList(this IEnumerable<UserWineListRow> rows) =>
        rows.Select(r => r.ToListItemDto()).ToList();
}