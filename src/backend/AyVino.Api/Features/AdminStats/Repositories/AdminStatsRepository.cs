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

    public async Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM users) AS TotalUsers,
                (SELECT COUNT(*) FROM users WHERE is_active = FALSE) AS BlockedUsers,
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
            Wineries: new WineryStatsDto((int)row.PendingWineries, (int)row.ApprovedWineries, (int)row.RejectedWineries),
            Cities: new CityStatsDto((int)row.PendingCities),
            Vintages: new VintageStatsDto((int)row.PendingVintages, (int)row.ApprovedVintages, (int)row.RejectedVintages),
            Wines: new WineStatsDto((int)row.TotalWines, (int)row.CommunityWines, (int)row.OfficialWines),
            Reviews: new ReviewStatsDto((int)row.TotalReviews)
        );
    }
}
