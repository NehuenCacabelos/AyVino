using System.Text.Json.Serialization;

namespace AyVino.Api.Features.Wines.DTOs;

public record ExistingVintageSummaryDto(
    [property: JsonPropertyName("year")] int? Year,
    [property: JsonPropertyName("mainGrapeId")] int? MainGrapeId,
    [property: JsonPropertyName("mainGrapeName")] string? MainGrapeName);
