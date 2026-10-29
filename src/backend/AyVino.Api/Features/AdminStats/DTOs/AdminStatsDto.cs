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
