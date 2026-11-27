using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Wines.DTOs;

public record WineResponseDto(
    int Id,
    int? WineryId,
    string? WineryNameText,
    string Name,
    string? Description,
    string WineType,
    int? LocationId,
    string SourceType,
    int? DuplicateOfWineId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount);