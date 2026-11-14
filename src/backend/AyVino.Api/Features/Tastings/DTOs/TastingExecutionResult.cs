using AyVino.Api.Features.Cellars.Models;

namespace AyVino.Api.Features.Tastings.DTOs;

public record TastingExecutionResult(
    TastingResponseDto Tasting,
    CellarItemListRow? UpdatedCellarItem
);
