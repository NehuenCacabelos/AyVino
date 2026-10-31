namespace AyVino.Api.Features.Uncorks.DTOs;

public record UncorkResponseDto(
    long ActivityId,
    DateTime OccurredAt,
    int? RemainingQuantity,
    int? ReviewId);
