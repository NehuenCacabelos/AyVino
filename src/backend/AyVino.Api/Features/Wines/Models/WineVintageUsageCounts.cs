namespace AyVino.Api.Features.Wines.Models;

public sealed record WineVintageUsageCounts(
    int ReviewCount = 0,
    int CellarItemCount = 0)
{
    public WineVintageUsageCounts() : this(0, 0) { }

    public WineVintageUsageCounts(long reviewCount, long cellarItemCount)
        : this((int)reviewCount, (int)cellarItemCount) { }

    public bool HasUserHistory => ReviewCount > 0 || CellarItemCount > 0;
}
