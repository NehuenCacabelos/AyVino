using AyVino.Api.Common.Data;
using AyVino.Api.Features.WineryCatalog.Models;
using Dapper;

namespace AyVino.Api.Features.WineryCatalog.Repositories;

public class WineryCatalogRepository(IDbConnectionFactory connectionFactory) : IWineryCatalogRepository
{
    public async Task<WineryCatalogOwnerWinery?> GetWineryByUserIdAsync(int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, status
            FROM wineries
            WHERE user_id = @UserId
            LIMIT 1;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineryCatalogOwnerWinery>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<WineryCatalogTotalsRow> GetTotalsByWineryIdAsync(int wineryId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT 
                COUNT(DISTINCT w.id) AS TotalLabels,
                COUNT(v.id) AS TotalVintages,
                COUNT(CASE WHEN v.approval_status = 2 THEN 1 END) AS VintagesApproved,
                COUNT(CASE WHEN v.approval_status = 1 THEN 1 END) AS VintagesPending,
                COUNT(CASE WHEN v.approval_status = 3 THEN 1 END) AS VintagesRejected
            FROM wines w
            LEFT JOIN wine_vintages v ON v.wine_id = w.id
            WHERE w.winery_id = @WineryId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleAsync<WineryCatalogTotalsRow>(
            new CommandDefinition(sql, new { WineryId = wineryId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<WineryCatalogWineRow>> GetWinesByWineryIdAsync(int wineryId, int limit, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, description, wine_type AS WineType, source_type AS SourceType,
                   rating_sum AS RatingSum, review_count AS ReviewCount
            FROM wines
            WHERE winery_id = @WineryId
            ORDER BY name ASC, id ASC
            LIMIT @Limit;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WineryCatalogWineRow>(
            new CommandDefinition(sql, new { WineryId = wineryId, Limit = limit }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<WineryCatalogVintageRow>> GetVintagesByWineIdsAsync(IEnumerable<int> wineIds, CancellationToken ct = default)
    {
        var ids = wineIds.ToArray();
        if (ids.Length == 0) return Array.Empty<WineryCatalogVintageRow>();

        const string sql = """
            SELECT id, wine_id AS WineId, year, alcohol_content AS AlcoholContent,
                   serving_temperature AS ServingTemperature, aging_advice AS AgingAdvice,
                   image_url AS ImageUrl, approval_status AS ApprovalStatus,
                   register_date AS RegisterDate, rating_sum AS RatingSum, review_count AS ReviewCount
            FROM wine_vintages
            WHERE wine_id = ANY(@Ids)
            ORDER BY year DESC NULLS LAST, id DESC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WineryCatalogVintageRow>(
            new CommandDefinition(sql, new { Ids = ids }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<WineryCatalogGrapeRow>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default)
    {
        var ids = vintageIds.ToArray();
        if (ids.Length == 0) return Array.Empty<WineryCatalogGrapeRow>();

        const string sql = """
            SELECT wg.wine_vintage_id AS WineVintageId, wg.grape_id AS GrapeId,
                   g.name AS GrapeName, wg.percentage AS Percentage
            FROM wine_grapes wg
            INNER JOIN grapes g ON g.id = wg.grape_id
            WHERE wg.wine_vintage_id = ANY(@Ids)
            ORDER BY wg.percentage DESC NULLS LAST, g.name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WineryCatalogGrapeRow>(
            new CommandDefinition(sql, new { Ids = ids }, cancellationToken: ct));
        return rows.AsList();
    }
}
