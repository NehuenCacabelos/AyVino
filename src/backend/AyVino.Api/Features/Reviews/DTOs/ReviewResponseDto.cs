using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Reviews.DTOs;

public record ReviewResponseDto(
    int Id,
    int UserId,
    string UserName,
    int WineVintageId,
    int? VintageYear,
    [property: JsonConverter(typeof(DecimalOnePlaceJsonConverter))] decimal Rating,
    string? Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt);