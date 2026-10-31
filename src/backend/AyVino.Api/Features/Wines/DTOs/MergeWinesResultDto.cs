namespace AyVino.Api.Features.Wines.DTOs;

public record MergeWinesResultDto(
    int TargetId,
    int DuplicateId,
    int MovedVintages,
    int MergedVintages,
    int MovedReviews,
    int DiscardedReviews,
    int MovedCellarItems,
    int MovedUserImages = 0,
    int DiscardedUserImages = 0,
    int MovedActivities = 0);
