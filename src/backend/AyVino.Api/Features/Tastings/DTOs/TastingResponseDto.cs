using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Tastings.DTOs;

public record TastingResponseDto(
    int Id,
    int UserId,
    int WineId,
    int WineVintageId,
    int? CellarId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? Rating,
    string? Comment,
    DateTime TastedAt,
    DateTime CreatedAt
);
