using System.Data;
using AyVino.Api.Common.Data;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class UserVintageImageRepository(IDbConnectionFactory connectionFactory) : IUserVintageImageRepository
{
    public async Task<Guid?> GetImageIdAsync(int userId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT image_id
            FROM user_vintage_images
            WHERE user_id = @UserId AND wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(sql, new { UserId = userId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task UpsertAsync(int userId, int wineVintageId, Guid imageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_vintage_images (user_id, wine_vintage_id, image_id, created_at)
            VALUES (@UserId, @WineVintageId, @ImageId, NOW() AT TIME ZONE 'UTC')
            ON CONFLICT (user_id, wine_vintage_id)
            DO UPDATE SET image_id = EXCLUDED.image_id, created_at = NOW() AT TIME ZONE 'UTC';
            """;
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, WineVintageId = wineVintageId, ImageId = imageId }, transaction, cancellationToken: ct));
    }

    public async Task<bool> DeleteAsync(int userId, int wineVintageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM user_vintage_images
            WHERE user_id = @UserId AND wine_vintage_id = @WineVintageId;
            """;
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, WineVintageId = wineVintageId }, transaction, cancellationToken: ct));
        return rows > 0;
    }
}
