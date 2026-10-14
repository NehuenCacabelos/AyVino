using AyVino.Api.Common.Data;
using AyVino.Api.Features.Follows.Models;
using Dapper;

namespace AyVino.Api.Features.Follows.Repositories;

public class FollowRepository(IDbConnectionFactory connectionFactory) : IFollowRepository
{
    public async Task<bool> AddUserFollowAsync(int followerId, int followedUserId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_follows (follower_id, followed_user_id)
            VALUES (@FollowerId, @FollowedUserId)
            ON CONFLICT DO NOTHING;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { FollowerId = followerId, FollowedUserId = followedUserId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> RemoveUserFollowAsync(int followerId, int followedUserId, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM user_follows
            WHERE follower_id = @FollowerId AND followed_user_id = @FollowedUserId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { FollowerId = followerId, FollowedUserId = followedUserId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<IEnumerable<FollowUserItem>> GetUserFollowersAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT u.id AS UserId, u.username AS Username, uf.created_at AS FollowedAt
            FROM user_follows uf
            JOIN users u ON u.id = uf.follower_id
            WHERE uf.followed_user_id = @UserId
            ORDER BY uf.created_at DESC, u.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<FollowUserItem>(
            new CommandDefinition(sql, new { UserId = userId, Offset = (pageNumber - 1) * pageSize, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<IEnumerable<FollowUserItem>> GetFollowingUsersAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT u.id AS UserId, u.username AS Username, uf.created_at AS FollowedAt
            FROM user_follows uf
            JOIN users u ON u.id = uf.followed_user_id
            WHERE uf.follower_id = @FollowerId
            ORDER BY uf.created_at DESC, u.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<FollowUserItem>(
            new CommandDefinition(sql, new { FollowerId = followerId, Offset = (pageNumber - 1) * pageSize, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<bool> AddWineryFollowAsync(int followerId, int wineryId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO winery_follows (follower_id, winery_id)
            VALUES (@FollowerId, @WineryId)
            ON CONFLICT DO NOTHING;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { FollowerId = followerId, WineryId = wineryId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> RemoveWineryFollowAsync(int followerId, int wineryId, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM winery_follows
            WHERE follower_id = @FollowerId AND winery_id = @WineryId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { FollowerId = followerId, WineryId = wineryId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<IEnumerable<FollowUserItem>> GetWineryFollowersAsync(int wineryId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT u.id AS UserId, u.username AS Username, wf.created_at AS FollowedAt
            FROM winery_follows wf
            JOIN users u ON u.id = wf.follower_id
            WHERE wf.winery_id = @WineryId
            ORDER BY wf.created_at DESC, u.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<FollowUserItem>(
            new CommandDefinition(sql, new { WineryId = wineryId, Offset = (pageNumber - 1) * pageSize, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<IEnumerable<FollowWineryItem>> GetFollowingWineriesAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT w.id AS WineryId, w.name AS Name, wf.created_at AS FollowedAt
            FROM winery_follows wf
            JOIN wineries w ON w.id = wf.winery_id
            WHERE wf.follower_id = @FollowerId
            ORDER BY wf.created_at DESC, w.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<FollowWineryItem>(
            new CommandDefinition(sql, new { FollowerId = followerId, Offset = (pageNumber - 1) * pageSize, PageSize = pageSize }, cancellationToken: ct));
    }
}