using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class WineVintageRepository(IDbConnectionFactory connectionFactory) : IWineVintageRepository
{
    private const string SelectColumns = """
        id, wine_id, year, alcohol_content, serving_temperature, aging_advice, image_url,
        approval_status, uploaded_by_user_id, register_date, rating_sum, review_count
        """;

    public async Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = $"""
            SELECT {SelectColumns}
            FROM wine_vintages
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineVintage>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<WineVintage?> GetByIdAsync(int id, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wv.id, wv.wine_id, wv.year, wv.alcohol_content, wv.serving_temperature,
                   wv.aging_advice, wv.image_url, wv.approval_status, wv.uploaded_by_user_id,
                   wv.register_date, wv.rating_sum, wv.review_count
            FROM wine_vintages wv
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE wv.id = @Id
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                OR (wv.approval_status = 2 AND (w.winery_id IS NULL OR wy.status = 2))
              );
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineVintage>(
            new CommandDefinition(sql, new { Id = id, CurrentUserId = currentUserId, IsAdmin = isAdmin }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        const string sql = $"""
            SELECT {SelectColumns}
            FROM wine_vintages
            WHERE wine_id = @WineId
            ORDER BY year DESC NULLS LAST;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineVintage>(
            new CommandDefinition(sql, new { WineId = wineId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wv.id, wv.wine_id, wv.year, wv.alcohol_content, wv.serving_temperature,
                   wv.aging_advice, wv.image_url, wv.approval_status, wv.uploaded_by_user_id,
                   wv.register_date, wv.rating_sum, wv.review_count
            FROM wine_vintages wv
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE wv.wine_id = @WineId
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                OR (wv.approval_status = 2 AND (w.winery_id IS NULL OR wy.status = 2))
              )
            ORDER BY wv.year DESC NULLS LAST;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineVintage>(
            new CommandDefinition(sql, new { WineId = wineId, CurrentUserId = currentUserId, IsAdmin = isAdmin }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = "SELECT wine_vintage_id, grape_id, percentage FROM wine_grapes WHERE wine_vintage_id = @VintageId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default)
    {
        var ids = vintageIds as int[] ?? vintageIds.ToArray();
        if (ids.Length == 0) return [];

        const string sql = """
            SELECT wine_vintage_id, grape_id, percentage
            FROM wine_grapes
            WHERE wine_vintage_id = ANY(@VintageIds);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { VintageIds = ids }, cancellationToken: ct));
    }

    public async Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string insertVintageSql = """
            INSERT INTO wine_vintages (wine_id, year, alcohol_content, serving_temperature, aging_advice, image_url, approval_status, uploaded_by_user_id, register_date, rating_sum, review_count)
            VALUES (@WineId, @Year, @AlcoholContent, @ServingTemperature, @AgingAdvice, @ImageUrl, @ApprovalStatus, @UploadedByUserId, @RegisterDate, 0, 0)
            RETURNING id;
            """;
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertVintageSql, new
            {
                vintage.WineId,
                vintage.Year,
                vintage.AlcoholContent,
                vintage.ServingTemperature,
                vintage.AgingAdvice,
                vintage.ImageUrl,
                ApprovalStatus = (int)vintage.ApprovalStatus,
                vintage.UploadedByUserId,
                vintage.RegisterDate
            }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineVintageId = id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);

        return vintage with { Id = id };
    }

    public async Task<bool> UpdateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string updateSql = """
            UPDATE wine_vintages
            SET year = @Year,
                alcohol_content = @AlcoholContent,
                serving_temperature = @ServingTemperature,
                aging_advice = @AgingAdvice,
                image_url = @ImageUrl
            WHERE id = @Id;
            """;
        const string deleteGrapesSql = "DELETE FROM wine_grapes WHERE wine_vintage_id = @VintageId;";
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var rows = await connection.ExecuteAsync(
            new CommandDefinition(updateSql, new
            {
                vintage.Id,
                vintage.Year,
                vintage.AlcoholContent,
                vintage.ServingTemperature,
                vintage.AgingAdvice,
                vintage.ImageUrl
            }, transaction: transaction, cancellationToken: ct));

        if (rows == 0)
        {
            await transaction.RollbackAsync(ct);
            return false;
        }

        await connection.ExecuteAsync(
            new CommandDefinition(deleteGrapesSql, new { VintageId = vintage.Id }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineVintageId = vintage.Id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = "UPDATE wine_vintages SET approval_status = @Status WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wine_vintages WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wine_vintages WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<WineVintageUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @Id) AS ReviewCount,
                (SELECT COUNT(*) FROM cellar_items WHERE wine_vintage_id = @Id) AS CellarItemCount;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleAsync<WineVintageUsageCounts>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<AdminWineVintageListRow>> GetPagedForAdminAsync(int pageNumber, int pageSize, int? status, CancellationToken ct = default)
    {
        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (status.HasValue)
        {
            conditions.Add("wv.approval_status = @Status");
            parameters.Add("Status", status.Value);
        }

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : string.Empty;
        var offset = (pageNumber - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sql = $"""
            SELECT wv.id AS VintageId, wv.wine_id AS WineId, w.name AS WineName, w.wine_type AS WineType, w.winery_id AS WineryId,
                   COALESCE(wy.name, w.winery_name_text) AS WineryName, wv.year AS Year, wv.alcohol_content AS AlcoholContent,
                   wv.image_url AS ImageUrl, wv.approval_status AS ApprovalStatus, wv.uploaded_by_user_id AS UploadedByUserId,
                   u.username AS UploadedByUsername, wv.register_date AS RegisterDate
            FROM wine_vintages wv
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN users u ON u.id = wv.uploaded_by_user_id
            {whereClause}
            ORDER BY wv.register_date ASC, wv.id ASC
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<AdminWineVintageListRow>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }
}
