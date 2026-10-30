using AyVino.Api.Common.Data;
using AyVino.Api.Features.WineryCatalog.Constants;
using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Models;
using AyVino.Api.Features.Wines.Enums;
using Dapper;

namespace AyVino.Api.Features.WineryCatalog.Repositories;

public class WineryCatalogRepository(IDbConnectionFactory connectionFactory) : IWineryCatalogRepository
{
    public async Task<WineryCatalogOwnerWinery?> GetWineryByUserIdAsync(int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, CAST(status AS integer) AS Status
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
            WHERE w.winery_id = @WineryId
              AND w.duplicate_of_wine_id IS NULL;
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
              AND duplicate_of_wine_id IS NULL
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
                   image_id AS ImageId, approval_status AS ApprovalStatus,
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

    public async Task<WineryPublicProfileRow?> GetWineryPublicProfileRowAsync(int wineryId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT 
                w.id, w.name, w.description, w.foundation_year AS FoundationYear, w.website,
                w.user_id AS UserId, CAST(w.status AS integer) AS Status, w.register_date AS RegisterDate,
                w.latitude, w.longitude, w.logo_image_id AS LogoImageId, w.banner_image_id AS BannerImageId,
                s.name AS StateName, c.name AS RegionName
            FROM wineries w
            LEFT JOIN locations l ON l.id = w.location_id
            LEFT JOIN cities c ON c.id = l.city_id
            LEFT JOIN states s ON s.id = c.state_id
            WHERE w.id = @WineryId
            LIMIT 1;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineryPublicProfileRow>(
            new CommandDefinition(sql, new { WineryId = wineryId }, cancellationToken: ct));
    }

    public async Task<int> GetFollowersCountAsync(int wineryId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM winery_follows wf
            INNER JOIN wineries w ON w.id = wf.winery_id
            WHERE wf.winery_id = @WineryId AND (w.user_id IS NULL OR wf.follower_id != w.user_id);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { WineryId = wineryId }, cancellationToken: ct));
    }

    public async Task<bool> IsFollowedByUserAsync(int wineryId, int userId, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM winery_follows WHERE winery_id = @WineryId AND follower_id = @UserId);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { WineryId = wineryId, UserId = userId }, cancellationToken: ct));
    }

    public async Task<WineryPublicRatingsAndTotalsRow> GetPublicRatingsAndTotalsAsync(int wineryId, bool isPreview, CancellationToken ct = default)
    {
        const string sql = """
            SELECT 
                COUNT(DISTINCT w.id) AS Labels,
                COUNT(v.id) AS Vintages,
                COALESCE(SUM(v.rating_sum), 0) AS RatingSum,
                COALESCE(SUM(v.review_count), 0) AS ReviewCount
            FROM wines w
            INNER JOIN wine_vintages v ON v.wine_id = w.id
            WHERE w.winery_id = @WineryId
              AND w.duplicate_of_wine_id IS NULL
              AND ((@IsPreview = TRUE AND v.approval_status != 3) OR (@IsPreview = FALSE AND v.approval_status = 2));
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleAsync<WineryPublicRatingsAndTotalsRow>(
            new CommandDefinition(sql, new { WineryId = wineryId, IsPreview = isPreview }, cancellationToken: ct));
    }

    public async Task<WineryPublicCatalogFiltersDto> GetPublicCatalogFiltersAsync(int wineryId, bool isPreview, CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT w.wine_type
            FROM wines w
            INNER JOIN wine_vintages v ON v.wine_id = w.id
            WHERE w.winery_id = @WineryId
              AND w.duplicate_of_wine_id IS NULL
              AND ((@IsPreview = TRUE AND v.approval_status != 3) OR (@IsPreview = FALSE AND v.approval_status = 2))
            ORDER BY w.wine_type;

            SELECT DISTINCT g.id, g.name
            FROM grapes g
            INNER JOIN wine_grapes wg ON wg.grape_id = g.id
            INNER JOIN wine_vintages v ON v.id = wg.wine_vintage_id
            INNER JOIN wines w ON w.id = v.wine_id
            WHERE w.winery_id = @WineryId
              AND w.duplicate_of_wine_id IS NULL
              AND ((@IsPreview = TRUE AND v.approval_status != 3) OR (@IsPreview = FALSE AND v.approval_status = 2))
            ORDER BY g.name ASC;

            SELECT DISTINCT v.year
            FROM wine_vintages v
            INNER JOIN wines w ON w.id = v.wine_id
            WHERE w.winery_id = @WineryId
              AND w.duplicate_of_wine_id IS NULL
              AND v.year IS NOT NULL
              AND ((@IsPreview = TRUE AND v.approval_status != 3) OR (@IsPreview = FALSE AND v.approval_status = 2))
            ORDER BY v.year DESC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(sql, new { WineryId = wineryId, IsPreview = isPreview }, cancellationToken: ct));

        var wineTypeEnums = (await multi.ReadAsync<int>()).ToList();
        var wineTypes = wineTypeEnums.Select(wt => ((WineType)wt).ToString()).ToList();

        var grapes = (await multi.ReadAsync<WineryPublicGrapeFilterDto>()).ToList();

        var years = (await multi.ReadAsync<int>()).ToList();

        return new WineryPublicCatalogFiltersDto(wineTypes, grapes, years);
    }

    public async Task<(int TotalCount, IReadOnlyList<WineryCatalogWineRow> Wines)> GetPublicCatalogWinesPagedAsync(
        int wineryId,
        bool isPreview,
        WineryPublicCatalogQueryParams query,
        CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var conditions = new List<string> { "w.winery_id = @WineryId", "w.duplicate_of_wine_id IS NULL" };
        var parameters = new DynamicParameters();
        parameters.Add("WineryId", wineryId);
        parameters.Add("IsPreview", isPreview);

        const string visibleVintageCondition = "((@IsPreview = TRUE AND v.approval_status != 3) OR (@IsPreview = FALSE AND v.approval_status = 2))";
        
        conditions.Add($"EXISTS (SELECT 1 FROM wine_vintages v WHERE v.wine_id = w.id AND {visibleVintageCondition})");

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            conditions.Add("w.name ILIKE @SearchPattern");
            parameters.Add("SearchPattern", $"%{query.Search.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(query.WineType) && Enum.TryParse<WineType>(query.WineType.Trim(), true, out var parsedWineType))
        {
            conditions.Add("w.wine_type = @WineType");
            parameters.Add("WineType", (int)parsedWineType);
        }

        if (query.GrapeId.HasValue)
        {
            const string grapeVintageCondition = "((@IsPreview = TRUE AND v_g.approval_status != 3) OR (@IsPreview = FALSE AND v_g.approval_status = 2))";
            conditions.Add($"EXISTS (SELECT 1 FROM wine_vintages v_g INNER JOIN wine_grapes wg ON wg.wine_vintage_id = v_g.id WHERE v_g.wine_id = w.id AND wg.grape_id = @GrapeId AND {grapeVintageCondition})");
            parameters.Add("GrapeId", query.GrapeId.Value);
        }

        if (query.Year.HasValue)
        {
            const string yearVintageCondition = "((@IsPreview = TRUE AND v_y.approval_status != 3) OR (@IsPreview = FALSE AND v_y.approval_status = 2))";
            conditions.Add($"EXISTS (SELECT 1 FROM wine_vintages v_y WHERE v_y.wine_id = w.id AND v_y.year = @Year AND {yearVintageCondition})");
            parameters.Add("Year", query.Year.Value);
        }

        var whereClause = string.Join(" AND ", conditions);

        var countSql = $"SELECT COUNT(*) FROM wines w WHERE {whereClause};";
        var totalCount = await connection.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: ct));

        if (totalCount == 0)
        {
            return (0, Array.Empty<WineryCatalogWineRow>());
        }

        const string sortYearVintageCondition = "((@IsPreview = TRUE AND v_s.approval_status != 3) OR (@IsPreview = FALSE AND v_s.approval_status = 2))";
        var sortClause = (query.Sort?.Trim().ToLowerInvariant()) switch
        {
            "rating" => $"ORDER BY (w.review_count >= {WineryCatalogConstants.MinReviewsForAverage}) DESC, (CAST(w.rating_sum AS double precision) / NULLIF(w.review_count, 0)) DESC NULLS LAST, w.name ASC, w.id ASC",
            "year" => $"ORDER BY (SELECT MAX(v_s.year) FROM wine_vintages v_s WHERE v_s.wine_id = w.id AND {sortYearVintageCondition}) DESC NULLS LAST, w.name ASC, w.id ASC",
            _ => "ORDER BY w.name ASC, w.id ASC"
        };

        var offset = (query.PageNumber - 1) * query.PageSize;
        parameters.Add("Offset", offset);
        parameters.Add("Limit", query.PageSize);

        var selectSql = $"""
            SELECT w.id, w.name, w.description, w.wine_type AS WineType, w.source_type AS SourceType,
                   w.rating_sum AS RatingSum, w.review_count AS ReviewCount
            FROM wines w
            WHERE {whereClause}
            {sortClause}
            LIMIT @Limit OFFSET @Offset;
            """;

        var rows = await connection.QueryAsync<WineryCatalogWineRow>(new CommandDefinition(selectSql, parameters, cancellationToken: ct));
        return (totalCount, rows.AsList());
    }

    public async Task<IReadOnlyList<WineryCatalogVintageRow>> GetPublicVintagesByWineIdsAsync(
        IEnumerable<int> wineIds,
        bool isPreview,
        CancellationToken ct = default)
    {
        var ids = wineIds.ToArray();
        if (ids.Length == 0) return Array.Empty<WineryCatalogVintageRow>();

        const string sql = """
            SELECT id, wine_id AS WineId, year, alcohol_content AS AlcoholContent,
                   serving_temperature AS ServingTemperature, aging_advice AS AgingAdvice,
                   image_id AS ImageId, approval_status AS ApprovalStatus,
                   register_date AS RegisterDate, rating_sum AS RatingSum, review_count AS ReviewCount
            FROM wine_vintages
            WHERE wine_id = ANY(@Ids)
              AND ((@IsPreview = TRUE AND approval_status != 3) OR (@IsPreview = FALSE AND approval_status = 2))
            ORDER BY year DESC NULLS LAST, id DESC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WineryCatalogVintageRow>(
            new CommandDefinition(sql, new { Ids = ids, IsPreview = isPreview }, cancellationToken: ct));
        return rows.AsList();
    }
}
