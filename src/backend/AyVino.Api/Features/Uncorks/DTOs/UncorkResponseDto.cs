using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Uncorks.DTOs;

public record UncorkResponseDto(
    int Id,
    int UserId,
    int WineId,
    int WineVintageId,
    int? CellarId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? Rating,
    string? Comment,
    DateTime UncorkedAt,
    DateTime CreatedAt)
{
    public UncorkResponseDto() : this(0, 0, 0, 0, null, null, null, default, default) { }
}
