using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.UserWines.Models;
using Dapper;

namespace AyVino.Api.Features.UserWines.Repositories;

public class UserWineRepository(IDbConnectionFactory connectionFactory) : IUserWineRepository
{
    public async Task<UserWine?> GetAsync(int userId, int wineId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT user_id, wine_id, is_wanted, is_tried, is_favorite, created_at, updated_at
            FROM user_wines
            WHERE user_id = @UserId AND wine_id = @WineId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<UserWine>(
            new CommandDefinition(sql, new { UserId = userId, WineId = wineId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<UserWineListRow>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, bool? wanted, bool? tried, bool? favorite, CancellationToken ct = default)
    {
        const string sql = """
            SELECT uw.wine_id AS WineId, w.name AS Name, w.wine_type AS WineType,
                   w.winery_id AS WineryId, w.winery_name_text AS WineryNameText,
                   w.rating_sum AS RatingSum, w.review_count AS ReviewCount,
                   uw.is_wanted AS IsWanted, uw.is_tried AS IsTried, uw.is_favorite AS IsFavorite,
                   COALESCE(uw.updated_at, uw.created_at) AS LastChangeAt
            FROM user_wines uw
            JOIN wines w ON w.id = uw.wine_id
            WHERE uw.user_id = @UserId
              AND (@Wanted IS NULL OR uw.is_wanted = @Wanted)
              AND (@Tried IS NULL OR uw.is_tried = @Tried)
              AND (@Favorite IS NULL OR uw.is_favorite = @Favorite)
            ORDER BY COALESCE(uw.updated_at, uw.created_at) DESC, uw.wine_id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<UserWineListRow>(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                Wanted = wanted,
                Tried = tried,
                Favorite = favorite,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    // Marcar: crea la fila si no existe, o suma la marca a las que ya había (OR).
    // Nunca apaga una marca existente, por eso es idempotente.
    // created_at lo completa el default de la base, igual que en las tablas de follows.
    public async Task MarkAsync(int userId, int wineId, bool wanted, bool tried, bool favorite, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_wines (user_id, wine_id, is_wanted, is_tried, is_favorite)
            VALUES (@UserId, @WineId, @Wanted, @Tried, @Favorite)
            ON CONFLICT (user_id, wine_id) DO UPDATE
            SET is_wanted   = user_wines.is_wanted   OR EXCLUDED.is_wanted,
                is_tried    = user_wines.is_tried    OR EXCLUDED.is_tried,
                is_favorite = user_wines.is_favorite OR EXCLUDED.is_favorite,
                updated_at  = now() AT TIME ZONE 'utc';
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                WineId = wineId,
                Wanted = wanted,
                Tried = tried,
                Favorite = favorite
            }, cancellationToken: ct));
    }

    // Desmarcar (solo deseado y favorito; "probado" no se desmarca).
    // 1) Si la fila quedaría con las tres marcas en no, se borra (la CHECK de la tabla lo exige).
    // 2) Si no, se apaga la marca pedida. Si la fila no existe, no pasa nada.
    public async Task UnmarkAsync(int userId, int wineId, bool clearWanted, bool clearFavorite, CancellationToken ct = default)
    {
        const string deleteSql = """
            DELETE FROM user_wines
            WHERE user_id = @UserId AND wine_id = @WineId
              AND NOT is_tried
              AND NOT (is_wanted AND NOT @ClearWanted)
              AND NOT (is_favorite AND NOT @ClearFavorite);
            """;
        const string updateSql = """
            UPDATE user_wines
            SET is_wanted   = is_wanted   AND NOT @ClearWanted,
                is_favorite = is_favorite AND NOT @ClearFavorite,
                updated_at  = now() AT TIME ZONE 'utc'
            WHERE user_id = @UserId AND wine_id = @WineId;
            """;

        var parameters = new
        {
            UserId = userId,
            WineId = wineId,
            ClearWanted = clearWanted,
            ClearFavorite = clearFavorite
        };

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(deleteSql, parameters, transaction, cancellationToken: ct));
            await connection.ExecuteAsync(
                new CommandDefinition(updateSql, parameters, transaction, cancellationToken: ct));

            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}