using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.AdminStats.DTOs;
using AyVino.Api.Features.Locations.Enums;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wines.Enums;
using Dapper;

namespace AyVino.Api.Features.AdminStats.Repositories;

public class AdminStatsRepository(IDbConnectionFactory connectionFactory) : IAdminStatsRepository
{
    private sealed class RawStatsRow
    {
        public long TotalUsers { get; set; }
        public long BlockedUsers { get; set; }
        public long TotalWineries { get; set; }
        public long PendingWineries { get; set; }
        public long ApprovedWineries { get; set; }
        public long RejectedWineries { get; set; }
        public long PendingCities { get; set; }
        public long PendingVintages { get; set; }
        public long ApprovedVintages { get; set; }
        public long RejectedVintages { get; set; }
        public long TotalWines { get; set; }
        public long CommunityWines { get; set; }
        public long OfficialWines { get; set; }
        public long TotalReviews { get; set; }
    }

    private sealed class RawGrapePresenceRow
    {
        public int GrapeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public long VintageCount { get; set; }
    }

    private sealed class RawWineryCountsRow
    {
        public long TotalWineries { get; set; }
        public long WithoutCoordinates { get; set; }
    }

    private sealed class RawRegionWineryCountRow
    {
        public int StateId { get; set; }
        public string StateName { get; set; } = string.Empty;
        public long WineryCount { get; set; }
    }

    private sealed class RawWineryPinRow
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? StateName { get; set; }
        public string? CityName { get; set; }
        public int? StateId { get; set; }
    }

    private sealed class RawRegionWineryItemRow
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int StateId { get; set; }
        public string? CityName { get; set; }
        public int? FoundationYear { get; set; }
        public bool HasCoordinates { get; set; }
    }

    public async Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM users WHERE LOWER(role) = LOWER(@UserRole)) AS TotalUsers,
                (SELECT COUNT(*) FROM users WHERE is_active = FALSE) AS BlockedUsers,
                (SELECT COUNT(*) FROM wineries) AS TotalWineries,
                (SELECT COUNT(*) FROM wineries WHERE status = @PendingWinery) AS PendingWineries,
                (SELECT COUNT(*) FROM wineries WHERE status = @ApprovedWinery) AS ApprovedWineries,
                (SELECT COUNT(*) FROM wineries WHERE status = @RejectedWinery) AS RejectedWineries,
                (SELECT COUNT(*) FROM cities WHERE status = @PendingCity) AS PendingCities,
                (SELECT COUNT(*) FROM wine_vintages WHERE approval_status = @PendingVintage) AS PendingVintages,
                (SELECT COUNT(*) FROM wine_vintages WHERE approval_status = @ApprovedVintage) AS ApprovedVintages,
                (SELECT COUNT(*) FROM wine_vintages WHERE approval_status = @RejectedVintage) AS RejectedVintages,
                (SELECT COUNT(*) FROM wines WHERE duplicate_of_wine_id IS NULL) AS TotalWines,
                (SELECT COUNT(*) FROM wines WHERE duplicate_of_wine_id IS NULL AND source_type = @CommunityWine) AS CommunityWines,
                (SELECT COUNT(*) FROM wines WHERE duplicate_of_wine_id IS NULL AND source_type = @OfficialWine) AS OfficialWines,
                (SELECT COUNT(*) FROM reviews) AS TotalReviews;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var row = await connection.QuerySingleAsync<RawStatsRow>(new CommandDefinition(sql, new
        {
            UserRole = AppRoles.User,
            PendingWinery = (short)WineryStatus.Pending,
            ApprovedWinery = (short)WineryStatus.Approved,
            RejectedWinery = (short)WineryStatus.Rejected,
            PendingCity = (short)CityStatus.Pending,
            PendingVintage = (short)ApprovalStatus.Pending,
            ApprovedVintage = (short)ApprovalStatus.Approved,
            RejectedVintage = (short)ApprovalStatus.Rejected,
            CommunityWine = (short)SourceType.Community,
            OfficialWine = (short)SourceType.Official
        }, cancellationToken: ct));

        return new AdminStatsDto(
            Users: new UserStatsDto((int)row.TotalUsers, (int)row.BlockedUsers),
            Wineries: new WineryStatsDto((int)row.TotalWineries, (int)row.PendingWineries, (int)row.ApprovedWineries, (int)row.RejectedWineries),
            Cities: new CityStatsDto((int)row.PendingCities),
            Vintages: new VintageStatsDto((int)row.PendingVintages, (int)row.ApprovedVintages, (int)row.RejectedVintages),
            Wines: new WineStatsDto((int)row.TotalWines, (int)row.CommunityWines, (int)row.OfficialWines),
            Reviews: new ReviewStatsDto((int)row.TotalReviews)
        );
    }

    public async Task<GrapesDistributionDto> GetGrapesDistributionAsync(CancellationToken ct = default)
    {
        const string totalSql = """
            SELECT COUNT(*)
            FROM wine_vintages wv
            INNER JOIN wines w ON w.id = wv.wine_id
            WHERE wv.approval_status = @ApprovedVintage
              AND w.duplicate_of_wine_id IS NULL
              AND EXISTS (
                  SELECT 1
                  FROM wine_grapes wg
                  WHERE wg.wine_vintage_id = wv.id
              );
            """;

        const string grapesSql = """
            SELECT
                g.id AS GrapeId,
                g.name AS Name,
                COUNT(DISTINCT wg.wine_vintage_id) AS VintageCount
            FROM wine_grapes wg
            INNER JOIN wine_vintages wv ON wv.id = wg.wine_vintage_id
            INNER JOIN wines w ON w.id = wv.wine_id
            INNER JOIN grapes g ON g.id = wg.grape_id
            WHERE wv.approval_status = @ApprovedVintage
              AND w.duplicate_of_wine_id IS NULL
            GROUP BY g.id, g.name
            ORDER BY VintageCount DESC, g.name ASC;
            """;

        var parameters = new { ApprovedVintage = (short)ApprovalStatus.Approved };

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var totalVintages = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(totalSql, parameters, cancellationToken: ct));

        var rows = await connection.QueryAsync<RawGrapePresenceRow>(
            new CommandDefinition(grapesSql, parameters, cancellationToken: ct));

        var grapes = rows
            .Select(r => new GrapePresenceDto(r.GrapeId, r.Name, (int)r.VintageCount))
            .ToList();

        return new GrapesDistributionDto((int)totalVintages, grapes);
    }

    public async Task<WineriesByRegionDto> GetWineriesByRegionAsync(CancellationToken ct = default)
    {
        const string countsSql = """
            SELECT
                COUNT(*) AS TotalWineries,
                COUNT(*) FILTER (WHERE w.latitude IS NULL OR w.longitude IS NULL) AS WithoutCoordinates
            FROM wineries w
            WHERE w.status = @ApprovedWinery;
            """;

        const string regionsSql = """
            SELECT
                s.id AS StateId,
                s.name AS StateName,
                COUNT(*) AS WineryCount
            FROM wineries w
            LEFT JOIN locations l ON l.id = w.location_id
            LEFT JOIN cities c ON c.id = l.city_id
            LEFT JOIN states s ON s.id = c.state_id
            WHERE w.status = @ApprovedWinery
              AND s.id IS NOT NULL
            GROUP BY s.id, s.name
            ORDER BY WineryCount DESC, s.name ASC;
            """;

        const string pinsSql = """
            SELECT
                w.id AS Id,
                w.name AS Name,
                w.latitude AS Latitude,
                w.longitude AS Longitude,
                s.name AS StateName,
                c.name AS CityName,
                s.id AS StateId
            FROM wineries w
            LEFT JOIN locations l ON l.id = w.location_id
            LEFT JOIN cities c ON c.id = l.city_id
            LEFT JOIN states s ON s.id = c.state_id
            WHERE w.status = @ApprovedWinery
              AND w.latitude IS NOT NULL
              AND w.longitude IS NOT NULL
            ORDER BY w.name ASC;
            """;

        const string wineriesSql = """
            SELECT
                w.id AS Id,
                w.name AS Name,
                s.id AS StateId,
                c.name AS CityName,
                w.foundation_year AS FoundationYear,
                (w.latitude IS NOT NULL AND w.longitude IS NOT NULL) AS HasCoordinates
            FROM wineries w
            LEFT JOIN locations l ON l.id = w.location_id
            LEFT JOIN cities c ON c.id = l.city_id
            LEFT JOIN states s ON s.id = c.state_id
            WHERE w.status = @ApprovedWinery
              AND s.id IS NOT NULL
            ORDER BY w.name ASC;
            """;

        var parameters = new { ApprovedWinery = (short)WineryStatus.Approved };

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var counts = await connection.QuerySingleAsync<RawWineryCountsRow>(
            new CommandDefinition(countsSql, parameters, cancellationToken: ct));

        var regionRows = await connection.QueryAsync<RawRegionWineryCountRow>(
            new CommandDefinition(regionsSql, parameters, cancellationToken: ct));

        var pinRows = await connection.QueryAsync<RawWineryPinRow>(
            new CommandDefinition(pinsSql, parameters, cancellationToken: ct));

        var wineryRows = await connection.QueryAsync<RawRegionWineryItemRow>(
            new CommandDefinition(wineriesSql, parameters, cancellationToken: ct));

        var regions = regionRows
            .Select(r => new RegionWineryCountDto(r.StateId, r.StateName, (int)r.WineryCount))
            .ToList();

        var pins = pinRows
            .Select(p => new WineryPinDto(p.Id, p.Name, p.Latitude, p.Longitude, p.StateName, p.CityName, p.StateId))
            .ToList();

        var wineries = wineryRows
            .Select(w => new RegionWineryItemDto(w.Id, w.Name, w.StateId, w.CityName, w.FoundationYear, w.HasCoordinates))
            .ToList();

        return new WineriesByRegionDto(
            TotalWineries: (int)counts.TotalWineries,
            WithoutCoordinates: (int)counts.WithoutCoordinates,
            Regions: regions,
            Pins: pins,
            Wineries: wineries);
    }
}
