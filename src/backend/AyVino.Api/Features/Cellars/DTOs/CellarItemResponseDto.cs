using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Cellars.DTOs;

public record CellarItemResponseDto(
    int WineVintageId,
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    int? Year,
    Guid? ImageId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount,
    int Quantity,
    DateOnly? PurchaseDate,
    string? Notes,
    DateTime LastChangeAt,
    string? WineryName = null,
    string? RegionName = null,
    string? GrapeName = null);
