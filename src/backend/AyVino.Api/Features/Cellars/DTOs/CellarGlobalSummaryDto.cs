namespace AyVino.Api.Features.Cellars.DTOs;

public record CellarGlobalSummaryDto(
    int TotalBottles,
    string? DominantVarietal,
    int? DominantVarietalPercentage);
