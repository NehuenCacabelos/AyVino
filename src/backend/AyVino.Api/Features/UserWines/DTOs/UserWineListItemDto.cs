using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.UserWines.DTOs;

public record UserWineListItemDto(
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount,
    bool IsWanted,
    bool IsTried,
    bool IsFavorite,
    DateTime LastChangeAt,
    string? WineryName = null,
    int? Vintage = null,
    string? ImageUrl = null,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? UserRating = null,
    string? UserComment = null);
