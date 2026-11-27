namespace AyVino.Api.Features.Wines.Models;

public sealed record WineUsageCounts(
    int DuplicateWinesCount = 0,
    int ReviewCount = 0,
    int UserWineCount = 0,
    int CellarItemCount = 0)
{
    public WineUsageCounts() : this(0, 0, 0, 0) { }

    public WineUsageCounts(long duplicateWinesCount, long reviewCount, long userWineCount, long cellarItemCount)
        : this((int)duplicateWinesCount, (int)reviewCount, (int)userWineCount, (int)cellarItemCount) { }

    public bool HasDuplicates => DuplicateWinesCount > 0;
    public bool HasUserHistory => ReviewCount > 0 || UserWineCount > 0 || CellarItemCount > 0;
    public bool HasBlockingUsage => HasDuplicates || HasUserHistory;
}
