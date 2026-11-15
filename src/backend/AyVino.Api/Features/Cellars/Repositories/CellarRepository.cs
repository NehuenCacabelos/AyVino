using AyVino.Api.Common.Data;
using AyVino.Api.Features.Cellars.Models;
using Dapper;

namespace AyVino.Api.Features.Cellars.Repositories;

public class CellarRepository(IDbConnectionFactory connectionFactory) : ICellarRepository
{
    public async Task<Cellar?> GetByIdAsync(int cellarId, int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, user_id, name, created_at, updated_at
            FROM cellars
            WHERE id = @CellarId AND user_id = @UserId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Cellar>(
            new CommandDefinition(sql, new { CellarId = cellarId, UserId = userId }, cancellationToken: ct));
    }

    public async Task<CellarSummaryRow?> GetSummaryByIdAsync(int cellarId, int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT c.id AS Id, c.name AS Name,
                   COUNT(ci.wine_vintage_id)::int AS VintageCount,
                   COALESCE(SUM(ci.quantity), 0)::int AS BottleCount,
                   c.created_at AS CreatedAt
            FROM cellars c
            LEFT JOIN cellar_items ci ON ci.cellar_id = c.id
            WHERE c.id = @CellarId AND c.user_id = @UserId
            GROUP BY c.id, c.name, c.created_at;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<CellarSummaryRow>(
            new CommandDefinition(sql, new { CellarId = cellarId, UserId = userId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CellarSummaryRow>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT c.id AS Id, c.name AS Name,
                   COUNT(ci.wine_vintage_id)::int AS VintageCount,
                   COALESCE(SUM(ci.quantity), 0)::int AS BottleCount,
                   c.created_at AS CreatedAt
            FROM cellars c
            LEFT JOIN cellar_items ci ON ci.cellar_id = c.id
            WHERE c.user_id = @UserId
            GROUP BY c.id, c.name, c.created_at
            ORDER BY c.name, c.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<CellarSummaryRow>(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<bool> ExistsByNameAsync(int userId, string name, int? excludeCellarId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1 FROM cellars
                WHERE user_id = @UserId
                  AND lower(name) = lower(@Name)
                  AND (@ExcludeId IS NULL OR id <> @ExcludeId));
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { UserId = userId, Name = name, ExcludeId = excludeCellarId }, cancellationToken: ct));
    }

    public async Task<bool> HasItemsAsync(int cellarId, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM cellar_items WHERE cellar_id = @CellarId);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { CellarId = cellarId }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(int userId, string name, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO cellars (user_id, name)
            VALUES (@UserId, @Name)
            RETURNING id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { UserId = userId, Name = name }, cancellationToken: ct));
    }

    public async Task<bool> UpdateNameAsync(int cellarId, int userId, string name, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE cellars
            SET name = @Name, updated_at = now() AT TIME ZONE 'utc'
            WHERE id = @CellarId AND user_id = @UserId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { CellarId = cellarId, UserId = userId, Name = name }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int cellarId, int userId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM cellars WHERE id = @CellarId AND user_id = @UserId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { CellarId = cellarId, UserId = userId }, cancellationToken: ct));
        return rowsAffected > 0;
    }
}