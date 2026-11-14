using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Tastings.DTOs;
using Dapper;

namespace AyVino.Api.Features.Tastings.Repositories;

public class TastingRepository(IDbConnectionFactory connectionFactory) : ITastingRepository
{
    private const string SelectCellarItemRowSql = """
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

    public async Task<TastingResponseDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT t.id AS Id,
                   t.user_id AS UserId,
                   wv.wine_id AS WineId,
                   t.wine_vintage_id AS WineVintageId,
                   t.cellar_id AS CellarId,
                   t.rating AS Rating,
                   t.comment AS Comment,
                   t.tasted_at AS TastedAt,
                   t.created_at AS CreatedAt
            FROM tastings t
            JOIN wine_vintages wv ON wv.id = t.wine_vintage_id
            WHERE t.id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<TastingResponseDto>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<TastingListItemDto>> GetPagedByUserIdAsync(
        int userId,
        int pageNumber,
        int pageSize,
        int? wineVintageId = null,
        CancellationToken ct = default)
    {
        var offset = (pageNumber - 1) * pageSize;
        const string sql = """
            SELECT
                t.id AS Id,
                v.wine_id AS WineId,
                t.wine_vintage_id AS WineVintageId,
                w.name AS WineName,
                COALESCE(wy.name, w.winery_name_text) AS WineryName,
                v.year AS Year,
                v.image_id AS ImageId,
                t.rating AS Rating,
                t.comment AS Comment,
                t.tasted_at AS TastedAt,
                c.name AS CellarName
            FROM tastings t
            JOIN wine_vintages v ON t.wine_vintage_id = v.id
            JOIN wines w ON v.wine_id = w.id
            LEFT JOIN wineries wy ON w.winery_id = wy.id
            LEFT JOIN cellars c ON t.cellar_id = c.id
            WHERE t.user_id = @UserId
              AND (@WineVintageId IS NULL OR t.wine_vintage_id = @WineVintageId)
            ORDER BY t.tasted_at DESC, t.id DESC
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<TastingListItemDto>(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                WineVintageId = wineVintageId,
                Offset = offset,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<TastingExecutionResult> RecordTastingInTransactionAsync(
        int userId,
        int wineVintageId,
        int? cellarId,
        decimal? rating,
        string? comment,
        DateTime tastedAt,
        CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            // 1. Obtener wine_id de la cosecha
            const string selectWineIdSql = "SELECT wine_id FROM wine_vintages WHERE id = @WineVintageId;";
            var wineId = await connection.ExecuteScalarAsync<int?>(
                new CommandDefinition(selectWineIdSql, new { WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

            if (!wineId.HasValue)
            {
                throw new NotFoundException($"Cosecha con ID {wineVintageId} no encontrada.");
            }

            CellarItemListRow? updatedCellarItem = null;

            // 2. Si vino desde una cava: verificar stock y descontar
            if (cellarId.HasValue)
            {
                const string selectItemSql = """
                    SELECT quantity
                    FROM cellar_items
                    WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId
                    FOR UPDATE;
                    """;
                var currentQuantity = await connection.ExecuteScalarAsync<int?>(
                    new CommandDefinition(selectItemSql, new { CellarId = cellarId.Value, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

                if (!currentQuantity.HasValue || currentQuantity.Value <= 0)
                {
                    throw new ConflictException("No quedan botellas de esta cosecha en la cava o el ítem no existe.");
                }

                var fetchRowSql = SelectCellarItemRowSql + " WHERE ci.cellar_id = @CellarId AND ci.wine_vintage_id = @WineVintageId;";
                var existingRow = await connection.QuerySingleOrDefaultAsync<CellarItemListRow>(
                    new CommandDefinition(fetchRowSql, new { CellarId = cellarId.Value, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

                int newQuantity = currentQuantity.Value - 1;

                if (newQuantity > 0)
                {
                    const string updateSql = """
                        UPDATE cellar_items
                        SET quantity = @Quantity,
                            updated_at = now() AT TIME ZONE 'utc'
                        WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
                        """;
                    await connection.ExecuteAsync(
                        new CommandDefinition(updateSql, new { CellarId = cellarId.Value, WineVintageId = wineVintageId, Quantity = newQuantity }, transaction, cancellationToken: ct));
                }
                else
                {
                    const string deleteSql = "DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
                    await connection.ExecuteAsync(
                        new CommandDefinition(deleteSql, new { CellarId = cellarId.Value, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));
                }

                if (existingRow is not null)
                {
                    updatedCellarItem = existingRow with { Quantity = newQuantity, LastChangeAt = DateTime.UtcNow };
                }
            }

            // 3. Insertar cata en tastings (el comentario es PRIVADO, vive solo aquí)
            const string insertTastingSql = """
                INSERT INTO tastings (user_id, wine_vintage_id, cellar_id, rating, comment, tasted_at, created_at)
                VALUES (@UserId, @WineVintageId, @CellarId, @Rating, @Comment, @TastedAt, now() AT TIME ZONE 'utc')
                RETURNING id, created_at;
                """;

            var (tastingId, createdAt) = await connection.QuerySingleAsync<(int Id, DateTime CreatedAt)>(
                new CommandDefinition(insertTastingSql, new
                {
                    UserId = userId,
                    WineVintageId = wineVintageId,
                    CellarId = cellarId,
                    Rating = rating,
                    Comment = comment,
                    TastedAt = tastedAt
                }, transaction, cancellationToken: ct));

            // 4. Marcar vino como probado (user_wines)
            const string markTriedSql = """
                INSERT INTO user_wines (user_id, wine_id, is_wanted, is_tried, is_favorite)
                VALUES (@UserId, @WineId, FALSE, TRUE, FALSE)
                ON CONFLICT (user_id, wine_id) DO UPDATE
                SET is_tried = TRUE,
                    updated_at = now() AT TIME ZONE 'utc';
                """;
            await connection.ExecuteAsync(
                new CommandDefinition(markTriedSql, new { UserId = userId, WineId = wineId.Value }, transaction, cancellationToken: ct));

            // 5. Si la cata trae puntaje: upsert de la reseña pública (actualiza SOLO rating y conserva comentario)
            if (rating.HasValue)
            {
                const string upsertReviewSql = """
                    INSERT INTO reviews (user_id, wine_vintage_id, rating, comment, created_at)
                    VALUES (@UserId, @WineVintageId, @Rating, NULL, now() AT TIME ZONE 'utc')
                    ON CONFLICT (user_id, wine_vintage_id) DO UPDATE
                    SET rating = EXCLUDED.rating,
                        updated_at = now() AT TIME ZONE 'utc';
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(upsertReviewSql, new
                    {
                        UserId = userId,
                        WineVintageId = wineVintageId,
                        Rating = rating.Value
                    }, transaction, cancellationToken: ct));

                const string updateVintageRatingSql = """
                    UPDATE wine_vintages
                    SET rating_sum = COALESCE((SELECT SUM(rating) FROM reviews WHERE wine_vintage_id = @WineVintageId), 0),
                        review_count = (SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @WineVintageId)
                    WHERE id = @WineVintageId;
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(updateVintageRatingSql, new { WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

                const string updateWineRatingSql = """
                    UPDATE wines
                    SET rating_sum = COALESCE((SELECT SUM(rating_sum) FROM wine_vintages WHERE wine_id = @WineId), 0),
                        review_count = COALESCE((SELECT SUM(review_count) FROM wine_vintages WHERE wine_id = @WineId), 0)
                    WHERE id = @WineId;
                    """;
                await connection.ExecuteAsync(
                    new CommandDefinition(updateWineRatingSql, new { WineId = wineId.Value }, transaction, cancellationToken: ct));
            }

            await transaction.CommitAsync(ct);

            var tastingResponse = new TastingResponseDto(
                tastingId,
                userId,
                wineId.Value,
                wineVintageId,
                cellarId,
                rating,
                comment,
                tastedAt,
                createdAt);

            return new TastingExecutionResult(tastingResponse, updatedCellarItem);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
