using AyVino.Api.Common.Data;
using AyVino.Api.Features.Auth.Models;
using Dapper;

namespace AyVino.Api.Features.Auth.Repositories;

public class RefreshTokenRepository(IDbConnectionFactory connectionFactory) : IRefreshTokenRepository
{
    public async Task SaveRefreshTokenAsync(RefreshToken token, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO refresh_tokens (token, user_id, expires_at, created_at, created_by_ip, revoked_at, revoked_by_ip, replaced_by_token)
            VALUES (@Token, @UserId, @ExpiresAt, @CreatedAt, @CreatedByIp, @RevokedAt, @RevokedByIp, @ReplacedByToken);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default)
    {
        const string sql = """
            SELECT token, user_id, expires_at, created_at, created_by_ip, revoked_at, revoked_by_ip, replaced_by_token
            FROM refresh_tokens
            WHERE token = @Token;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<RefreshToken>(
            new CommandDefinition(sql, new { Token = token }, cancellationToken: ct));
    }

    public async Task<bool> UpdateRefreshTokenAsync(RefreshToken token, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE refresh_tokens
            SET revoked_at = @RevokedAt,
                revoked_by_ip = @RevokedByIp,
                replaced_by_token = @ReplacedByToken
            WHERE token = @Token;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> RevokeRefreshTokenAsync(string token, string? ipAddress, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE refresh_tokens
            SET revoked_at = @RevokedAt,
                revoked_by_ip = @RevokedByIp
            WHERE token = @Token AND revoked_at IS NULL;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Token = token, RevokedAt = DateTime.UtcNow, RevokedByIp = ipAddress }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<int> RevokeAllUserTokensAsync(int userId, string? ipAddress, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE refresh_tokens
            SET revoked_at = @RevokedAt,
                revoked_by_ip = @RevokedByIp
            WHERE user_id = @UserId AND revoked_at IS NULL;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, RevokedAt = DateTime.UtcNow, RevokedByIp = ipAddress }, cancellationToken: ct));
    }

    public async Task<int> DeleteExpiredAndRevokedTokensAsync(DateTime beforeUtc, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM refresh_tokens
            WHERE (expires_at < @BeforeUtc) 
               OR (revoked_at IS NOT NULL AND revoked_at < @BeforeUtc);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteAsync(new CommandDefinition(sql, new { BeforeUtc = beforeUtc }, cancellationToken: ct));
    }
}
