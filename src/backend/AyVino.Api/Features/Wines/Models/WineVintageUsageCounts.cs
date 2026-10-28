namespace AyVino.Api.Features.Wines.Models;

public sealed record WineVintageUsageCounts(
    int ReviewCount,
    int CellarItemCount)
{
    public bool HasUserHistory => ReviewCount > 0 || CellarItemCount > 0;
}
