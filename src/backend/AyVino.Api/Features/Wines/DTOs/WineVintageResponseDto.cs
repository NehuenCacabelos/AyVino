using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Wines.DTOs;

public record WineGrapeResponseDto(int GrapeId, decimal? Percentage);

public record WineVintageResponseDto(
    int Id,
    int WineId,
    int? Year,
    decimal? AlcoholContent,
    int? ServingTemperature,
    string? AgingAdvice,
    Guid? ImageId,
    string ApprovalStatus,
    int UploadedByUserId,
    DateTime RegisterDate,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount,
    IEnumerable<WineGrapeResponseDto> Grapes);
