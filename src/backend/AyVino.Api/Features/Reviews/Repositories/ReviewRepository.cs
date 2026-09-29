using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using Dapper;

namespace AyVino.Api.Features.Reviews.Repositories;

public class ReviewRepository(IDbConnectionFactory connectionFactory) : IReviewRepository
{
    public async Task<Review?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, user_id AS UserId, wine_vintage_id AS WineVintageId,
                   rating AS Rating, comment AS Comment,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM reviews
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Review>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<ReviewResponseDto?> GetResponseByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT r.id AS Id, r.user_id AS UserId, u.nombre_usuario AS UserName,
                   r.wine_vintage_id AS WineVintageId, wv.year AS VintageYear,
                   r.rating AS Rating, r.comment AS Comment,
                   r.created_at AS CreatedAt, r.updated_at AS UpdatedAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN wine_vintages wv ON wv.id = r.wine_vintage_id
            WHERE r.id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<ReviewResponseDto>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT r.id AS Id, r.user_id AS UserId, u.nombre_usuario AS UserName,
                   r.wine_vintage_id AS WineVintageId, wv.year AS VintageYear,
                   r.rating AS Rating, r.comment AS Comment,
                   r.created_at AS CreatedAt, r.updated_at AS UpdatedAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN wine_vintages wv ON wv.id = r.wine_vintage_id
            WHERE r.wine_vintage_id = @WineVintageId
            ORDER BY r.created_at DESC
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<ReviewResponseDto>(
            new CommandDefinition(sql, new
            {
                WineVintageId = wineVintageId,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT r.id AS Id, r.user_id AS UserId, u.nombre_usuario AS UserName,
                   r.wine_vintage_id AS WineVintageId, wv.year AS VintageYear,
                   r.rating AS Rating, r.comment AS Comment,
                   r.created_at AS CreatedAt, r.updated_at AS UpdatedAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN wine_vintages wv ON wv.id = r.wine_vintage_id
            WHERE wv.wine_id = @WineId
            ORDER BY r.created_at DESC
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<ReviewResponseDto>(
            new CommandDefinition(sql, new
            {
                WineId = wineId,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<bool> ExistsForUserAndVintageAsync(int userId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS(SELECT 1 FROM reviews WHERE user_id = @UserId AND wine_vintage_id = @WineVintageId);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { UserId = userId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Review review, CancellationToken ct = default)
    {
        const string insertSql = """
            INSERT INTO reviews (user_id, wine_vintage_id, rating, comment, created_at)
            VALUES (@UserId, @WineVintageId, @Rating, @Comment, @CreatedAt)
            RETURNING id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            var id = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(insertSql, new
                {
                    review.UserId,
                    review.WineVintageId,
                    review.Rating,
                    review.Comment,
                    review.CreatedAt
                }, transaction, cancellationToken: ct));

            await RecalculateRatingsAsync(connection, transaction, review.WineVintageId, ct);

            await transaction.CommitAsync(ct);
            return id;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(Review review, CancellationToken ct = default)
    {
        const string updateSql = """
            UPDATE reviews
            SET rating = @Rating, comment = @Comment, updated_at = @UpdatedAt
            WHERE id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            var rowsAffected = await connection.ExecuteAsync(
                new CommandDefinition(updateSql, new
                {
                    review.Id,
                    review.Rating,
                    review.Comment,
                    review.UpdatedAt
                }, transaction, cancellationToken: ct));

            if (rowsAffected > 0)
                await RecalculateRatingsAsync(connection, transaction, review.WineVintageId, ct);

            await transaction.CommitAsync(ct);
            return rowsAffected > 0;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string selectVintageSql = "SELECT wine_vintage_id FROM reviews WHERE id = @Id;";
        const string deleteSql = "DELETE FROM reviews WHERE id = @Id;";

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            var wineVintageId = await connection.ExecuteScalarAsync<int?>(
                new CommandDefinition(selectVintageSql, new { Id = id }, transaction, cancellationToken: ct));

            if (wineVintageId is null)
            {
                await transaction.CommitAsync(ct);
                return false;
            }

            var rowsAffected = await connection.ExecuteAsync(
                new CommandDefinition(deleteSql, new { Id = id }, transaction, cancellationToken: ct));

            if (rowsAffected > 0)
                await RecalculateRatingsAsync(connection, transaction, wineVintageId.Value, ct);

            await transaction.CommitAsync(ct);
            return rowsAffected > 0;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    // Cascada: recalcula la cosecha con AVG/COUNT sobre reviews, y despues
    // el rollup de la etiqueta sumando todas sus cosechas. Todo dentro de
    // la misma transaccion que el INSERT/UPDATE/DELETE que la disparo.
    private static async Task RecalculateRatingsAsync(IDbConnection connection, IDbTransaction transaction, int wineVintageId, CancellationToken ct)
    {
        const string updateVintageSql = """
            UPDATE wine_vintages
            SET rating_sum = COALESCE((SELECT SUM(rating) FROM reviews WHERE wine_vintage_id = @WineVintageId), 0),
                review_count = (SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @WineVintageId)
            WHERE id = @WineVintageId
            RETURNING wine_id;
            """;

        const string updateWineSql = """
            UPDATE wines
            SET rating_sum = COALESCE((SELECT SUM(rating_sum) FROM wine_vintages WHERE wine_id = @WineId), 0),
                review_count = COALESCE((SELECT SUM(review_count) FROM wine_vintages WHERE wine_id = @WineId), 0)
            WHERE id = @WineId;
            """;

        var wineId = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(updateVintageSql, new { WineVintageId = wineVintageId }, transaction, cancellationToken: ct));

        await connection.ExecuteAsync(
            new CommandDefinition(updateWineSql, new { WineId = wineId }, transaction, cancellationToken: ct));
    }
}