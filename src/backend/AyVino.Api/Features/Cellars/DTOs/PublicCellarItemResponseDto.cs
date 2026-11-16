using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Cellars.DTOs;

public record PublicCellarItemResponseDto(
    int WineVintageId,
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    int? Year,
    Guid? ImageId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount);
