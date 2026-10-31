namespace AyVino.Api.Features.Wines.Models;

public sealed record WineUsageCounts(
    int DuplicateWinesCount,
    int ReviewCount,
    int UserWineCount,
    int CellarItemCount,
    int OtherUserImagesCount = 0,
    int OtherUserActivitiesCount = 0)
{
    public bool HasDuplicates => DuplicateWinesCount > 0;
    public bool HasUserHistory => ReviewCount > 0 
        || UserWineCount > 0 
        || CellarItemCount > 0 
        || OtherUserImagesCount > 0 
        || OtherUserActivitiesCount > 0;
    public bool HasBlockingUsage => HasDuplicates || HasUserHistory;
}
