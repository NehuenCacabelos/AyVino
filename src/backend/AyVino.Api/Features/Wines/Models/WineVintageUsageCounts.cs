namespace AyVino.Api.Features.Wines.Models;

public sealed record WineVintageUsageCounts(
    int ReviewCount,
    int CellarItemCount,
    int OtherUserImagesCount = 0,
    int OtherUserActivitiesCount = 0)
{
    public bool HasUserHistory => ReviewCount > 0 
        || CellarItemCount > 0 
        || OtherUserImagesCount > 0 
        || OtherUserActivitiesCount > 0;
}
