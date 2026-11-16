using AyVino.Api.Features.Cellars.Models;

namespace AyVino.Api.Features.Uncorks.DTOs;

public record UncorkExecutionResult(
    UncorkResponseDto Uncork,
    CellarItemListRow? UpdatedCellarItem
);
