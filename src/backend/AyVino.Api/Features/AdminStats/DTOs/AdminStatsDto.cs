namespace AyVino.Api.Features.AdminStats.DTOs;

public record UserStatsDto(int Total, int Blocked);

public record WineryStatsDto(int Total, int Pending, int Approved, int Rejected)
{
    public WineryStatsDto(int pending, int approved, int rejected)
        : this(pending + approved + rejected, pending, approved, rejected)
    {
    }
}

public record CityStatsDto(int Pending);

public record VintageStatsDto(int Pending, int Approved, int Rejected);

public record WineStatsDto(int Total, int Community, int Official);

public record ReviewStatsDto(int Total);

public record AdminStatsDto(
    UserStatsDto Users,
    WineryStatsDto Wineries,
    CityStatsDto Cities,
    VintageStatsDto Vintages,
    WineStatsDto Wines,
    ReviewStatsDto Reviews);

public record GrapePresenceDto(int GrapeId, string Name, int VintageCount);

public record GrapesDistributionDto(int TotalVintages, IReadOnlyList<GrapePresenceDto> Grapes);

public record RegionWineryCountDto(int StateId, string StateName, int WineryCount);

public record WineryPinDto(int Id, string Name, decimal Latitude, decimal Longitude, string? StateName, string? CityName);

public record WineriesByRegionDto(
    int TotalWineries,
    int WithoutCoordinates,
    IReadOnlyList<RegionWineryCountDto> Regions,
    IReadOnlyList<WineryPinDto> Pins);
