using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Tastings.DTOs;

public record TastingListItemDto(
    int Id,
    int WineId,
    int WineVintageId,
    string WineName,
    string? WineryName,
    int? Year,
    Guid? ImageId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? Rating,
    string? Comment,
    DateTime TastedAt,
    string? CellarName
);
