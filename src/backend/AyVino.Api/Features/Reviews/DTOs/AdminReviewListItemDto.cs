using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Reviews.DTOs;

public record AdminReviewListItemDto(
    int Id,
    [property: JsonConverter(typeof(DecimalOnePlaceJsonConverter))] decimal Rating,
    string? Comment,
    DateTime CreatedAt,
    int? UserId,
    string? Username,
    int WineVintageId,
    int WineId,
    string WineName,
    int? Year)
{
    public AdminReviewListItemDto() : this(0, 0m, null, default, null, null, 0, 0, string.Empty, null) { }
}
