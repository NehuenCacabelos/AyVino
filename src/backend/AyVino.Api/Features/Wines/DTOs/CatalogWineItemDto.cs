using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Wines.DTOs;

public record CatalogWineItemDto(
    int Id,
    int? WineryId,
    string? WineryNameText,
    string? WineryName,
    string Name,
    string? Description,
    string WineType,
    int? LocationId,
    string? RegionName,
    string? Varietal,
    int? Vintage,
    Guid? ImageId,
    string? ImageUrl,
    string SourceType,
    int? DuplicateOfWineId,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating,
    int ReviewCount,
    Guid? WineryLogoImageId = null);

