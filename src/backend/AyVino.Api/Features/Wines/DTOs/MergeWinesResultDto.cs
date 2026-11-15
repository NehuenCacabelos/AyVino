namespace AyVino.Api.Features.Wines.DTOs;

public record MergeWinesResultDto(
    int TargetId,
    int DuplicateId,
    int MovedVintages,
    int MergedVintages,
    int MovedReviews,
    int DiscardedReviews,
    int MovedCellarItems);
