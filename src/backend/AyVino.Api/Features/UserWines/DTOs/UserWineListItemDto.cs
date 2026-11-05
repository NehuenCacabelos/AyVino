namespace AyVino.Api.Features.UserWines.DTOs;

public record UserWineListItemDto(
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    decimal? AverageRating,
    int ReviewCount,
    bool IsWanted,
    bool IsTried,
    bool IsFavorite,
    DateTime LastChangeAt);