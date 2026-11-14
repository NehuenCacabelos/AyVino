using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Uncorks.DTOs;

public record UncorkListItemDto(
    int Id,
    int WineId,
    int WineVintageId,
    string WineName,
    string? WineryName,
    int? Year,
    Guid? ImageId,
    string? CellarName,
    DateTime UncorkedAt,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? Rating,
    string? Comment)
{
    public UncorkListItemDto() : this(0, 0, 0, string.Empty, null, null, null, null, default, null, null) { }
}
