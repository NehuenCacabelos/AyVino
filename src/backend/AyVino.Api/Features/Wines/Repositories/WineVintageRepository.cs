using AyVino.Api.Features.Wines.DTOs;
using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class WineVintageRepository(IDbConnectionFactory connectionFactory) : IWineVintageRepository
{
    private const string SelectColumns = """
        id, wine_id, year, alcohol_content, serving_temperature, aging_advice, image_id AS ImageId,
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
                   wv.aging_advice, wv.image_id AS ImageId, wv.approval_status, wv.uploaded_by_user_id,
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
                   wv.aging_advice, wv.image_id AS ImageId, wv.approval_status, wv.uploaded_by_user_id,
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
        const string sql = """
            SELECT grape_id, percentage
            FROM wine_grapes
            WHERE wine_vintage_id = @VintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wine_vintage_id, grape_id, percentage
            FROM wine_grapes
            WHERE wine_vintage_id = ANY(@Ids);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { Ids = vintageIds.ToArray() }, cancellationToken: ct));
    }

    public async Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string insertVintageSql = """
            INSERT INTO wine_vintages (wine_id, year, alcohol_content, serving_temperature, aging_advice, image_id, approval_status, uploaded_by_user_id, register_date, rating_sum, review_count)
            VALUES (@WineId, @Year, @AlcoholContent, @ServingTemperature, @AgingAdvice, @ImageId, @ApprovalStatus, @UploadedByUserId, @RegisterDate, 0, 0)
            RETURNING id;
            """;

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertVintageSql, new
            {
                vintage.WineId,
                vintage.Year,
                vintage.AlcoholContent,
                vintage.ServingTemperature,
                vintage.AgingAdvice,
                vintage.ImageId,
                ApprovalStatus = (int)vintage.ApprovalStatus,
                vintage.UploadedByUserId,
                vintage.RegisterDate
            }, transaction: transaction, cancellationToken: ct));

        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

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
                aging_advice = @AgingAdvice
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
                vintage.AgingAdvice
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

    public async Task<bool> UpdateImageIdAsync(int vintageId, Guid? imageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wine_vintages
            SET image_id = @ImageId
            WHERE id = @VintageId;
            """;
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { VintageId = vintageId, ImageId = imageId }, transaction: transaction, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateImageIdAsync(int vintageId, Guid? imageId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await UpdateImageIdAsync(vintageId, imageId, connection, null, ct);
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wine_vintages
            SET approval_status = @Status
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wine_vintages WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT 1 FROM wine_vintages WHERE id = @Id LIMIT 1;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public Task<WineVintageUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default) =>
        GetUsageCountsAsync(id, null, ct);

    public async Task<WineVintageUsageCounts> GetUsageCountsAsync(int id, int? excludeUserId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT 
                (SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @Id) AS ReviewCount,
                (SELECT COUNT(*) FROM cellar_items WHERE wine_vintage_id = @Id) AS CellarItemCount,
                (SELECT COUNT(*) FROM user_vintage_images uvi
                 JOIN wine_vintages wv ON wv.id = uvi.wine_vintage_id
                 WHERE uvi.wine_vintage_id = @Id
                   AND (wv.uploaded_by_user_id IS NULL OR uvi.user_id != COALESCE(@ExcludeUserId, wv.uploaded_by_user_id))) AS OtherUserImagesCount,
                (SELECT COUNT(*) FROM user_activities ua
                 JOIN wine_vintages wv ON wv.id = ua.wine_vintage_id
                 WHERE ua.wine_vintage_id = @Id
                   AND (wv.uploaded_by_user_id IS NULL OR ua.user_id != COALESCE(@ExcludeUserId, wv.uploaded_by_user_id))) AS OtherUserActivitiesCount;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleAsync<WineVintageUsageCounts>(
            new CommandDefinition(sql, new { Id = id, ExcludeUserId = excludeUserId }, cancellationToken: ct));
    }

        public Task<IEnumerable<AdminWineVintageListRow>> GetPagedForAdminAsync(int pageNumber, int pageSize, int? status, CancellationToken ct = default) =>
        GetPagedForAdminAsync(pageNumber, pageSize, status, null, ct);

public async Task<IEnumerable<AdminWineVintageListRow>> GetPagedForAdminAsync(int pageNumber, int pageSize, int? status, string? sort, CancellationToken ct = default)
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

        string orderBy;
        if (string.Equals(sort, "users", StringComparison.OrdinalIgnoreCase) ||
            (string.IsNullOrWhiteSpace(sort) && status == (int)ApprovalStatus.Pending))
        {
            orderBy = "CommunityUsers DESC, wv.register_date ASC, wv.id ASC";
        }
        else
        {
            orderBy = "wv.register_date ASC, wv.id ASC";
        }

        var sql = $"""
            SELECT wv.id AS VintageId, wv.wine_id AS WineId, w.name AS WineName, w.wine_type AS WineType, w.winery_id AS WineryId,
                   COALESCE(wy.name, w.winery_name_text) AS WineryName, wv.year AS Year, wv.alcohol_content AS AlcoholContent,
                   wv.image_id AS ImageId, wv.approval_status AS ApprovalStatus, wv.uploaded_by_user_id AS UploadedByUserId,
                   u.username AS UploadedByUsername, wv.register_date AS RegisterDate,
                   (
                       SELECT COUNT(DISTINCT usr.user_id)
                       FROM (
                           SELECT wv.uploaded_by_user_id AS user_id WHERE wv.uploaded_by_user_id IS NOT NULL
                           UNION
                           SELECT c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = wv.id
                           UNION
                           SELECT r.user_id FROM reviews r WHERE r.wine_vintage_id = wv.id
                           UNION
                           SELECT uvi.user_id FROM user_vintage_images uvi WHERE uvi.wine_vintage_id = wv.id
                       ) usr
                   ) AS CommunityUsers
            FROM wine_vintages wv
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN users u ON u.id = wv.uploaded_by_user_id
            {whereClause}
            ORDER BY {orderBy}
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<AdminWineVintageListRow>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }

    public async Task<IEnumerable<VintageContributionDto>> GetContributionsAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT u.id AS UserId, u.username AS Username, uvi.image_id AS PersonalImageId,
                   (wv.uploaded_by_user_id = u.id) AS IsUploader
            FROM (
                SELECT uploaded_by_user_id AS user_id FROM wine_vintages WHERE id = @VintageId AND uploaded_by_user_id IS NOT NULL
                UNION
                SELECT c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = @VintageId
                UNION
                SELECT user_id FROM reviews WHERE wine_vintage_id = @VintageId
                UNION
                SELECT user_id FROM user_vintage_images WHERE wine_vintage_id = @VintageId
            ) users_of_vintage
            JOIN users u ON u.id = users_of_vintage.user_id
            JOIN wine_vintages wv ON wv.id = @VintageId
            LEFT JOIN user_vintage_images uvi ON uvi.wine_vintage_id = @VintageId AND uvi.user_id = u.id
            ORDER BY IsUploader DESC, u.username ASC;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<VintageContributionDto>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }
    public async Task<int> GetDistinctUserCountAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(DISTINCT user_id)
            FROM (
                SELECT uploaded_by_user_id AS user_id FROM wine_vintages WHERE id = @VintageId AND uploaded_by_user_id IS NOT NULL
                UNION
                SELECT c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = @VintageId
                UNION
                SELECT user_id FROM reviews WHERE wine_vintage_id = @VintageId
                UNION
                SELECT user_id FROM user_vintage_images WHERE wine_vintage_id = @VintageId
            ) u;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyDictionary<int, int>> GetDistinctUserCountsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default)
    {
        var idList = vintageIds.ToList();
        if (idList.Count == 0) return new Dictionary<int, int>();

        const string sql = """
            SELECT vintage_id AS Key, COUNT(DISTINCT user_id) AS Value
            FROM (
                SELECT id AS vintage_id, uploaded_by_user_id AS user_id FROM wine_vintages WHERE id = ANY(@VintageIds) AND uploaded_by_user_id IS NOT NULL
                UNION
                SELECT ci.wine_vintage_id AS vintage_id, c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = ANY(@VintageIds)
                UNION
                SELECT wine_vintage_id AS vintage_id, user_id FROM reviews WHERE wine_vintage_id = ANY(@VintageIds)
                UNION
                SELECT wine_vintage_id AS vintage_id, user_id FROM user_vintage_images WHERE wine_vintage_id = ANY(@VintageIds)
            ) u
            GROUP BY vintage_id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<KeyValuePair<int, int>>(
            new CommandDefinition(sql, new { VintageIds = idList }, cancellationToken: ct));
        return rows.ToDictionary(r => r.Key, r => r.Value);
    }

    public async Task<bool> IsUserParticipantAsync(int vintageId, int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM wine_vintages WHERE id = @VintageId AND uploaded_by_user_id = @UserId
                UNION ALL
                SELECT 1 FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = @VintageId AND c.user_id = @UserId
                UNION ALL
                SELECT 1 FROM reviews WHERE wine_vintage_id = @VintageId AND user_id = @UserId
                UNION ALL
                SELECT 1 FROM user_vintage_images WHERE wine_vintage_id = @VintageId AND user_id = @UserId
            );
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { VintageId = vintageId, UserId = userId }, cancellationToken: ct));
    }

    public async Task<HashSet<int>> GetParticipantVintageIdsAsync(int userId, IEnumerable<int> vintageIds, CancellationToken ct = default)
    {
        var idList = vintageIds.ToList();
        if (idList.Count == 0) return [];

        const string sql = """
            SELECT DISTINCT vintage_id
            FROM (
                SELECT id AS vintage_id FROM wine_vintages WHERE id = ANY(@VintageIds) AND uploaded_by_user_id = @UserId
                UNION
                SELECT ci.wine_vintage_id AS vintage_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = ANY(@VintageIds) AND c.user_id = @UserId
                UNION
                SELECT wine_vintage_id AS vintage_id FROM reviews WHERE wine_vintage_id = ANY(@VintageIds) AND user_id = @UserId
                UNION
                SELECT wine_vintage_id AS vintage_id FROM user_vintage_images WHERE wine_vintage_id = ANY(@VintageIds) AND user_id = @UserId
            ) u;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<int>(
            new CommandDefinition(sql, new { VintageIds = idList, UserId = userId }, cancellationToken: ct));
        return rows.ToHashSet();
    }
}
