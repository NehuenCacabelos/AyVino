namespace AyVino.Api.Features.Wines.Models;

public sealed record WineUsageCounts(
    int DuplicateWinesCount,
    int ReviewCount,
    int UserWineCount,
    int CellarItemCount,
    int OtherUserImagesCount = 0,
    int OtherUserActivitiesCount = 0)
{
    public WineUsageCounts(long duplicateWinesCount, long reviewCount, long userWineCount, long cellarItemCount, long otherUserImagesCount = 0, long otherUserActivitiesCount = 0)
        : this((int)duplicateWinesCount, (int)reviewCount, (int)userWineCount, (int)cellarItemCount, (int)otherUserImagesCount, (int)otherUserActivitiesCount)
    {
    }

    public bool HasDuplicates => DuplicateWinesCount > 0;
    public bool HasUserHistory => ReviewCount > 0 
        || UserWineCount > 0 
        || CellarItemCount > 0 
        || OtherUserImagesCount > 0 
        || OtherUserActivitiesCount > 0;
    public bool HasBlockingUsage => HasDuplicates || HasUserHistory;
}
