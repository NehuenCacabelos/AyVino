using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.Cellars.Models;
using Dapper;

namespace AyVino.Api.Features.Cellars.Repositories;

public class CellarItemRepository(IDbConnectionFactory connectionFactory) : ICellarItemRepository
{
    // Base compartida entre el detalle y el listado: ítem + cosecha + etiqueta.
    private const string SelectRowSql = """
        SELECT ci.wine_vintage_id AS WineVintageId, wv.wine_id AS WineId,
               w.name AS Name, w.wine_type AS WineType,
               w.winery_id AS WineryId, w.winery_name_text AS WineryNameText,
               wy.name AS WineryName,
               COALESCE(c.name || ', ' || s.name, s.name, wy_c.name || ', ' || wy_s.name, wy_s.name) AS RegionName,
               main_grape.grape_name AS GrapeName,
               wv.year AS Year, wv.image_id AS ImageId,
               wv.rating_sum AS RatingSum, wv.review_count AS ReviewCount,
               ci.quantity AS Quantity, ci.purchase_date AS PurchaseDate, ci.notes AS Notes,
               COALESCE(ci.updated_at, ci.created_at) AS LastChangeAt
        FROM cellar_items ci
        JOIN wine_vintages wv ON wv.id = ci.wine_vintage_id
        JOIN wines w ON w.id = wv.wine_id
        LEFT JOIN wineries wy ON wy.id = w.winery_id
        LEFT JOIN locations loc ON loc.id = w.location_id
        LEFT JOIN cities c ON c.id = loc.city_id
        LEFT JOIN states s ON s.id = c.state_id
        LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
        LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
        LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
        LEFT JOIN LATERAL (
            SELECT g.name AS grape_name
            FROM wine_grapes wg
            INNER JOIN grapes g ON g.id = wg.grape_id
            WHERE wg.wine_vintage_id = wv.id
            ORDER BY wg.percentage DESC NULLS LAST, g.name ASC
            LIMIT 1
        ) main_grape ON TRUE
        """;

    public async Task<CellarItem?> GetAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT cellar_id, wine_vintage_id, quantity, purchase_date, notes, created_at, updated_at
            FROM cellar_items
            WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<CellarItem>(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task<CellarItemListRow?> GetRowAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = SelectRowSql + """

            WHERE ci.cellar_id = @CellarId AND ci.wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<CellarItemListRow>(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CellarItemListRow>> GetAllByCellarAsync(int cellarId, int pageNumber, int pageSize, int? wineType, int? year, CancellationToken ct = default)
    {
        const string sql = SelectRowSql + """

            WHERE ci.cellar_id = @CellarId
              AND (@WineType IS NULL OR w.wine_type = @WineType)
              AND (@Year IS NULL OR wv.year = @Year)
            ORDER BY w.name, wv.year DESC NULLS LAST, ci.wine_vintage_id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<CellarItemListRow>(
            new CommandDefinition(sql, new
            {
                CellarId = cellarId,
                WineType = wineType,
                Year = year,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CellarItemListRow>> GetAllByUsernameAsync(string username, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT ON (ci.wine_vintage_id)
                   ci.wine_vintage_id AS WineVintageId, wv.wine_id AS WineId,
                   w.name AS Name, w.wine_type AS WineType,
                   w.winery_id AS WineryId, w.winery_name_text AS WineryNameText,
                   wy.name AS WineryName,
                   COALESCE(loc_c.name || ', ' || s.name, s.name, wy_c.name || ', ' || wy_s.name, wy_s.name) AS RegionName,
                   main_grape.grape_name AS GrapeName,
                   wv.year AS Year, wv.image_id AS ImageId,
                   wv.rating_sum AS RatingSum, wv.review_count AS ReviewCount,
                   ci.quantity AS Quantity, ci.purchase_date AS PurchaseDate, ci.notes AS Notes,
                   COALESCE(ci.updated_at, ci.created_at) AS LastChangeAt
            FROM cellar_items ci
            JOIN wine_vintages wv ON wv.id = ci.wine_vintage_id
            JOIN wines w ON w.id = wv.wine_id
            JOIN cellars c ON c.id = ci.cellar_id
            JOIN users u ON u.id = c.user_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN locations loc ON loc.id = w.location_id
            LEFT JOIN cities loc_c ON loc_c.id = loc.city_id
            LEFT JOIN states s ON s.id = loc_c.state_id
            LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
            LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
            LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
            LEFT JOIN LATERAL (
                SELECT g.name AS grape_name
                FROM wine_grapes wg
                INNER JOIN grapes g ON g.id = wg.grape_id
                WHERE wg.wine_vintage_id = wv.id
                ORDER BY wg.percentage DESC NULLS LAST, g.name ASC
                LIMIT 1
            ) main_grape ON TRUE
            WHERE LOWER(u.username) = LOWER(@Username) AND u.is_active = true
            ORDER BY ci.wine_vintage_id, ci.created_at DESC
            LIMIT @PageSize OFFSET @Offset;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<CellarItemListRow>(
            new CommandDefinition(sql, new
            {
                Username = username,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task CreateAsync(CellarItem item, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO cellar_items (cellar_id, wine_vintage_id, quantity, purchase_date, notes)
            VALUES (@CellarId, @WineVintageId, @Quantity, @PurchaseDate, @Notes);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                item.CellarId,
                item.WineVintageId,
                item.Quantity,
                item.PurchaseDate,
                item.Notes
            }, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(int cellarId, int wineVintageId, int quantity, DateOnly? purchaseDate, string? notes, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE cellar_items
            SET quantity = @Quantity, purchase_date = @PurchaseDate, notes = @Notes,
                updated_at = now() AT TIME ZONE 'utc'
            WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                CellarId = cellarId,
                WineVintageId = wineVintageId,
                Quantity = quantity,
                PurchaseDate = purchaseDate,
                Notes = notes
            }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
        return rowsAffected > 0;
    }
        public async Task<IReadOnlyList<int>> GetVintageIdsAsync(int cellarId, CancellationToken ct = default)
    {
        const string sql = "SELECT wine_vintage_id FROM cellar_items WHERE cellar_id = @CellarId ORDER BY wine_vintage_id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var ids = await connection.QueryAsync<int>(
            new CommandDefinition(sql, new { CellarId = cellarId }, cancellationToken: ct));
        return ids.ToList();
    }

    public Task<CellarItemListRow?> UncorkAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default) =>
        UncorkAsync(userId, cellarId, wineVintageId, null, null, ct);

    public async Task<CellarItemListRow?> UncorkAsync(int userId, int cellarId, int wineVintageId, int? rating, string? comment, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            const string lockSql = """
                SELECT ci.quantity AS Quantity, wv.wine_id AS WineId
                FROM cellar_items ci
                JOIN wine_vintages wv ON wv.id = ci.wine_vintage_id
                WHERE ci.cellar_id = @CellarId AND ci.wine_vintage_id = @WineVintageId
                FOR UPDATE;
                """;

            var current = await connection.QuerySingleOrDefaultAsync<CellarItemLockRow>(
                new CommandDefinition(lockSql, new { CellarId = cellarId, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

            if (current is null || current.Quantity <= 0)
            {
                await transaction.RollbackAsync(ct);
                return null;
            }

            var fetchRowSql = SelectRowSql + """

                WHERE ci.cellar_id = @CellarId AND ci.wine_vintage_id = @WineVintageId;
                """;
            var existingRow = await connection.QuerySingleOrDefaultAsync<CellarItemListRow>(
                new CommandDefinition(fetchRowSql, new { CellarId = cellarId, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

            if (existingRow is null)
            {
                await transaction.RollbackAsync(ct);
                return null;
            }

            int newQuantity = current.Quantity - 1;

            if (newQuantity > 0)
            {
                const string updateSql = """
                    UPDATE cellar_items
                    SET quantity = @Quantity,
                        updated_at = now() AT TIME ZONE 'utc'
                    WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(updateSql, new { CellarId = cellarId, WineVintageId = wineVintageId, Quantity = newQuantity }, transaction, cancellationToken: ct));
            }
            else
            {
                const string deleteSql = "DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
                await connection.ExecuteAsync(
                    new CommandDefinition(deleteSql, new { CellarId = cellarId, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));
            }

            const string markTriedSql = """
                INSERT INTO user_wines (user_id, wine_id, is_wanted, is_tried, is_favorite)
                VALUES (@UserId, @WineId, FALSE, TRUE, FALSE)
                ON CONFLICT (user_id, wine_id) DO UPDATE
                SET is_tried = TRUE,
                    updated_at = now() AT TIME ZONE 'utc';
                """;
            await connection.ExecuteAsync(
                new CommandDefinition(markTriedSql, new { UserId = userId, WineId = current.WineId }, transaction, cancellationToken: ct));

            if (rating.HasValue)
            {
                const string upsertReviewSql = """
                    INSERT INTO reviews (user_id, wine_vintage_id, rating, comment, created_at)
                    VALUES (@UserId, @WineVintageId, @Rating, @Comment, now() AT TIME ZONE 'utc')
                    ON CONFLICT (user_id, wine_vintage_id) DO UPDATE
                    SET rating = EXCLUDED.rating,
                        comment = EXCLUDED.comment,
                        updated_at = now() AT TIME ZONE 'utc';
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(upsertReviewSql, new
                    {
                        UserId = userId,
                        WineVintageId = wineVintageId,
                        Rating = rating.Value,
                        Comment = comment
                    }, transaction, cancellationToken: ct));

                const string updateVintageRatingSql = """
                    UPDATE wine_vintages
                    SET rating_sum = COALESCE((SELECT SUM(rating) FROM reviews WHERE wine_vintage_id = @WineVintageId), 0),
                        review_count = (SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @WineVintageId)
                    WHERE id = @WineVintageId
                    RETURNING wine_id;
                    """;
                var wineId = await connection.ExecuteScalarAsync<int>(
                    new CommandDefinition(updateVintageRatingSql, new { WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

                const string updateWineRatingSql = """
                    UPDATE wines
                    SET rating_sum = COALESCE((SELECT SUM(rating_sum) FROM wine_vintages WHERE wine_id = @WineId), 0),
                        review_count = COALESCE((SELECT SUM(review_count) FROM wine_vintages WHERE wine_id = @WineId), 0)
                    WHERE id = @WineId;
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(updateWineRatingSql, new { WineId = wineId }, transaction, cancellationToken: ct));
            }

            await transaction.CommitAsync(ct);

            return existingRow with { Quantity = newQuantity };
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private sealed record CellarItemLockRow(int Quantity, int WineId);
}